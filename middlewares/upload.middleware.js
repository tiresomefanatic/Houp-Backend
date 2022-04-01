const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const multer = require("multer");
const AWS = require("aws-sdk");
const createHttpError = require("http-errors");
const httpStatus = require("../utils/http_status_codes");
const { uploadConstraints, fileTypes } = require("../constants");
const {
  ProfilesModel,
  MediaModel,
  ProjectsModel,
  JobsModel,
} = require("../models");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  Bucket: process.env.S3_BUCKET_NAME,
});

const s3 = new AWS.S3();

const s3UploadFile = (file, cb) => {
  const dirPath = path
    .relative(path.join(__dirname, "../public"), file.destination)
    .replace("\\", "/");

  const fileData = fs.readFileSync(file.path);

  s3.upload(
    {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${dirPath}/${file.filename}`,
      Body: fileData,
    },
    (err, res) => {
      if (err) {
        return cb(err);
      }

      fs.unlink(file.path, (error) => {
        if (error) {
          console.error(error);
        }

        const data = {
          file_type: fileTypes.S3,
          file_name: file.filename,
          dir_path: dirPath,
          src: res.Location,
        };
        return cb(null, data);
      });
    }
  );
};
const s3DeleteFile = (file, cb) => {
  s3.deleteObject(
    {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${file.dir_path}/${file.file_name}`,
    },
    (err, res) => {
      if (err) {
        cb(err);
      } else {
        cb(null);
      }
    }
  );
};

module.exports = {
  s3Upload: (type, multiple = false) => async (req, res, next) => {
    const errTitle = "Error when uploading file to S3.";

    try {
      const oldFiles = [];
      switch (type) {
        case "profile_avatar": {
          const profile = await ProfilesModel.findById(req.params.id);
          if (profile && profile.profile_picture) {
            oldFiles.push(profile.profile_picture);
          }
          break;
        }
        case "profile_cover": {
          const profile = await ProfilesModel.findById(req.params.id);
          if (profile && profile.cover_picture) {
            oldFiles.push(profile.cover_picture);
          }
          break;
        }
        case "media": {
          if (req.body.media_id) {
            const media = await MediaModel.findById(req.body.media_id);
            if (media) {
              if (media.cover_picture) {
                oldFiles.push(media.cover_picture);
              }
              if (media.media) {
                oldFiles.push(...media.media);
              }
            }
          }
          break;
        }
        case "project": {
          const project = await ProjectsModel.findById(req.body.project_id);
          if (project && project.project_cover_picture) {
            oldFiles.push(project.project_cover_picture);
          }
          break;
        }
        case "job": {
          const job = await JobsModel.findById(req.body.job_id);
          if (job && job.project_cover_picture) {
            oldFiles.push(job.project_cover_picture);
          }
          break;
        }
        default: {
          break;
        }
      }
      oldFiles.forEach((file) => {
        if (file.file_type === fileTypes.S3) {
          s3DeleteFile(file, (err) => {
            if (err) {
              console.error(err);
            }
          });
        } else if (file.file_type === fileTypes.STATIC) {
          fs.unlink(file.path);
        }
      });

      if (!multiple && req.file) {
        s3UploadFile(req.file, (err, file) => {
          if (err) {
            return next(
              createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
                title: errTitle,
                message: err,
              })
            );
          }

          req.file = file;
          return next();
        });
      } else if (multiple && req.files) {
        if (type === "media") {
          if (
            (req.files.cover_picture ?? []).length > 0 ||
            (req.files.media ?? []).length > 0
          ) {
            const callback = () => {
              s3UploadFile(req.files.cover_picture[0], (err, file) => {
                if (err) {
                  return next(
                    createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
                      title: errTitle,
                      message: err,
                    })
                  );
                }

                req.files.cover_picture = file;

                const media = [];
                const files = [...(req.files.media ?? [])];
                if (files.length > 0) {
                  let index = 0;
                  const cb = (err, file) => {
                    if (err) {
                      return next(
                        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
                          title: errTitle,
                          message: err,
                        })
                      );
                    }

                    media.push(file);

                    if (index >= files.length - 1) {
                      req.files.media = media;
                      return next();
                    }

                    index += 1;
                    s3UploadFile(files[index], cb);
                  };

                  s3UploadFile(files[index], cb);
                } else {
                  req.files.media = [];
                  return next();
                }
              });
            };

            if (
              (req.files.cover_picture ?? []).length === 0 &&
              (req.files.media ?? []).length > 0
            ) {
              const firstFile = req.files.media[0];

              if (firstFile.mimetype.startsWith("video")) {
                const thumb_dir = path.join(
                  __dirname,
                  `../public/videos/media_media_thumbnails`
                );
                const ext = path.extname(firstFile.filename);
                const thumb_fileName =
                  firstFile.filename.slice(
                    0,
                    firstFile.filename.length - ext.length
                  ) + "_thumbnail.png";

                ffmpeg.ffprobe(firstFile.path, (error, metadata) => {
                  if (error) {
                    return next(
                      createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
                        title: errTitle,
                        message: error,
                      })
                    );
                  }

                  ffmpeg(firstFile.path)
                    .thumbnail({
                      folder: thumb_dir,
                      filename: thumb_fileName,
                      count: 1,
                    })
                    .on("error", (err) => {
                      return next(
                        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
                          title: errTitle,
                          message: err,
                        })
                      );
                    })
                    .on("end", () => {
                      const thumb_path = path.join(thumb_dir, thumb_fileName);
                      req.files.cover_picture = [
                        {
                          path: thumb_path,
                          destination: thumb_dir,
                          filename: thumb_fileName,
                        },
                      ];
                      callback();
                    });
                });
              } else {
                req.files.cover_picture = [req.files.media.shift()];
                callback();
              }
            } else {
              callback();
            }
          } else {
            req.files = null;
            return next();
          }
        } else {
          req.files = null;
          return next();
        }
      } else {
        req.file = null;
        req.files = null;
        return next();
      }
    } catch (e) {
      return next(
        createHttpError(httpStatus.INTERNAL_SERVER_ERROR, {
          title: errTitle,
          message: e,
        })
      );
    }
  },
  mediaMedia: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).replace(".", "");

        let fileType;
        Object.keys(uploadConstraints).forEach((type) => {
          if (uploadConstraints[type].ext.includes(ext)) {
            fileType = type;
          }
        });
        if (!fileType) {
          return cb(new Error("Media files should be of appropriate format."));
        } else {
          const dir = path.join(
            __dirname,
            `../public/${fileType}s/media_media`
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }

          cb(null, dir);
        }
      },
      filename: (req, file, cb) => {
        const fileNameSplit = file.originalname.split(".");
        const ext = fileNameSplit.pop();
        const fileName = fileNameSplit.join(".");

        const dateTimeStamp = Date.now();

        cb(
          null,
          req.params.id +
            "_" +
            file.fieldname +
            "_" +
            fileName +
            "_" +
            dateTimeStamp +
            "." +
            ext
        );
      },
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).replace(".", "");

      let fileType;
      Object.keys(uploadConstraints).forEach((type) => {
        if (uploadConstraints[type].ext.includes(ext)) {
          fileType = type;
        }
      });
      if (!fileType) {
        return cb(new Error("Media files should be of appropriate format."));
      } else {
        if (uploadConstraints[fileType].fileSize < file.size) {
          return cb(
            new Error(
              `${fileType} file types have to be smaller than ${uploadConstraints[fileType].fileSize} in size.`
            )
          );
        }
      }

      cb(null, true);
    },
  }),
  profileMedia: (fieldname) => {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(
            __dirname,
            "../public/images/" + fieldname + "s"
          );

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }

          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const fileNameSplit = file.originalname.split(".");
          const ext = fileNameSplit.pop();
          const fileName = fileNameSplit.join(".");

          const dateTimeStamp = Date.now();

          cb(
            null,
            req.params.id +
              "_" +
              fieldname +
              "_" +
              fileName +
              "_" +
              dateTimeStamp +
              "." +
              ext
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).replace(".", "");
        if (!uploadConstraints.image.ext.includes(ext)) {
          return cb(
            new Error(
              `Only images with proper format (${JSON.stringify(
                uploadConstraints.image.ext
              )}) are allowed.`
            )
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: uploadConstraints.image.fileSize,
      },
    });
  },
  projectMedia: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../public/images/project_covers");

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }

        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const fileNameSplit = file.originalname.split(".");
        const ext = fileNameSplit.pop();
        const fileName = fileNameSplit.join(".");

        const dateTimeStamp = Date.now();

        cb(
          null,
          req.params.id +
            "_project-cover_" +
            fileName +
            "_" +
            dateTimeStamp +
            "." +
            ext
        );
      },
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).replace(".", "");
      if (!uploadConstraints.image.ext.includes(ext)) {
        return cb(
          new Error(
            `Only images with proper format (${JSON.stringify(
              uploadConstraints.image.ext
            )}) are allowed.`
          )
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: uploadConstraints.image.fileSize,
    },
  }),
  jobMedia: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../public/images/job_covers");

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }

        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const fileNameSplit = file.originalname.split(".");
        const ext = fileNameSplit.pop();
        const fileName = fileNameSplit.join(".");

        const dateTimeStamp = Date.now();

        cb(
          null,
          req.params.id +
            "_job-cover_" +
            fileName +
            "_" +
            dateTimeStamp +
            "." +
            ext
        );
      },
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).replace(".", "");
      if (!uploadConstraints.image.ext.includes(ext)) {
        return cb(
          new Error(
            `Only images with proper format (${JSON.stringify(
              uploadConstraints.image.ext
            )}) are allowed.`
          )
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: uploadConstraints.image.fileSize,
    },
  }),
};
