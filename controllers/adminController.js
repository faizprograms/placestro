const db = require("../models");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var validator = require("validator");
const passport = require("passport");

const {
  verfiyMail,
  dbErrorHandler,
  logError,
  generateToken,
  sendPasswordReset,
  sendReport,
} = require("../util/util");

const controllerUtil = require("../util/controllerUtil");

const admin = {
  signIn: function (req, res, next) {
    return passport.authenticate(
      "admin_local",
      { session: false },
      (err, user, info) => {
        if (err || !user) {
          return res.status(400).json({
            status: "failed",
            msg: info ? info.message : "Login failed",
          });
        }
        req.login(user, { session: false }, (err) => {
          if (err) {
            res.status(500).json({ status: "failed", msg: err });
          }
          if(!user.isAdmin){
            return res.json({ status: "failure",msg:"Invalid creds" });
          }
          //filtering user id and email for payload and setting exp time as 7 day
          let payload = JSON.stringify({
            id: user._id,
            username: user.username,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
          });
          // generate a signed son web token with the contents of user object and return it in the response
          const token = jwt.sign(payload, process.env.JWT_KEY);
          return res.json({ status: "sucess", token });
          sendReport(`new user login ${user.name}`);
        });
      }
    )(req, res);
  },
  getCompanyData:function(req,res){
    if(req.params.companyId){
      db.Companies.findOne({_id:req.params.companyId})
      .then((company)=>{
        res.json({
          status: "sucess",
          company:company
        });
      })
      .catch((err)=>{
        res
        .send(500)
        .json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
      })
    }
  },
  updateCompanyData:function(req,res){
    if(req.params.companyId && req.body.company_name && req.body.company_rating && req.body.company_reviews){
    
      db.Companies.findOneAndUpdate({_id:req.params.companyId},{name:req.body.company_name,rating:req.body.company_rating,reviews:req.body.company_reviews})
      .then((company)=>{
        res.json({
          status: "sucess",
          msg:"Sucessfully updated"
        });
      })
      .catch((err)=>{
        res
        .send(500)
        .json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
      })
    }else{
      res
        .send(500)
        .json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
    }
  },

  getCounts: function (req, res) {
    db.User.countDocuments({})
      .then((user_count) => {
        db.Companies.countDocuments({})
          .then((company_count) => {
            db.Reviews.countDocuments({})
              .then((review_count) => {
                res.json({
                  status: "sucess",
                  user_count,
                  company_count,
                  review_count,
                });
              })
              .catch((err) => {
                res
                  .send(500)
                  .json({
                    status: "failure",
                    message: "Some Error Occured. Try Again!",
                  });
              });
          })
          .catch((err) => {
            res
              .send(500)
              .json({
                status: "failure",
                message: "Some Error Occured. Try Again!",
              });
          });
      })
      .catch((err) => {
        res
          .send(500)
          .json({
            status: "failure",
            message: "Some Error Occured. Try Again!",
          });
      });
  },
  getAllUsers: function (req, res) {
    let limit = Number(req.query.limit) || 10;
    let skip = req.query.page > 1 ? Number((req.query.page - 1) * limit) : 0;

    let lookup = {from: "reviews",localField: "_id",foreignField: "userId",as: "reviews"};  

    // let group=  {_id:"$reviews","numOfReviews":{$sum:1},user:{ "$push": "$$ROOT" }}
    let group={ $addFields: {numOfReviews: {$size: "$reviews"}}}

    db.User.aggregate([{ $lookup: lookup },group,{$unset:"reviews"}])
      .skip(skip)
      .limit(limit)
      .then((users) => {
        db.User.countDocuments({})
          .then((count) => {
            res.json({
              users: users,
              count: count,
            });
          })
          .catch((err) => {
            console.log(err);
            res
              .send(500)
              .json({
                status: "failure",
                message: "Some Error Occured. Try Again!",
              });
          });
      })
      .catch((err) => {
        console.log(err);
        res.send(500).json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
      });
  },  
  updateUserReview: function (req, res) {
    if (controllerUtil.checkReview(req.body)) {
      db.Companies.findOne({ name: req.body.name.toLowerCase() })
        .then((companyObj) => {
          //if company exist in our db use the company id
          if (companyObj) {
            let new_review = controllerUtil.createNewReview(req.body);
            db.Reviews.findOneAndUpdate(
              { _id: req.body.id },
              { ...new_review }
            )
              .then((reviewObj) => {
                res.json({
                  status: "sucess",
                  msg: "sucessfully updated your review",
                });

                let msg = `review updated  for ${companyObj.name} by ${req.user.name} \n`;
                Object.keys(reviewObj["_doc"]).forEach((key) => {
                  if (key === "roundsDetails") {
                    Object.keys(reviewObj["_doc"][key]).forEach((key2) => {
                      msg += `${key2} : ${reviewObj["_doc"][key][key2]}\n`;
                    });
                  }
                  if (key != "_id") {
                    msg += `${key} : ${reviewObj["_doc"][key]}\n`;
                  }
                });
                sendReport(msg);

                //if old rating not equal to new rating then update the rating
                if (req.body.old_rating != req.body.rating) {
                  db.Companies.findOneAndUpdate(
                    {
                      _id: companyObj._id,
                    },
                    {
                      rating:
                        Number(companyObj.rating) -
                        Number(req.body.old_rating) +
                        Number(req.body.rating),
                    }
                  ).then((a) => {});
                }
              })
              .catch((err) => {
                logError(err.msg, err);
                res.json({
                  status: "failed",
                  msg: "Sorry Something went wrong. Please try again",
                });
              });
          }
          //create new company then use the id
          else {
            //if user change company send dont change company name
            return res.json({
              status: "failed",
              msg: "Sorry You are not allowed to change company name if you like delete the review and add new review",
            });
          }
        })
        .catch((err) => {
          logError(err.msg, err);
          res.json({
            status: "failed",
            msg: "Sorry Something went wrong. Please try again",
          });
        });
    } else {
      res.json({ status: "failed", msg: "Please fill all the data" });
    }
  },    
  deleteUserReview: function (req, res) {
    if (req.params.reviewId) {
      db.Reviews.findOneAndRemove({ _id: req.params.reviewId })
        .then((reviewObj) => {
          res.json({
            status: "sucess",
            msg: "sucessfully deleted your review",
          });
          db.Companies.findOne({ _id: reviewObj.companyId }).then(
            (companyObj) => {
              if (companyObj) {
                sendReport(
                  `new review deleted for ${companyObj.name} by admin`
                );
                let new_rating = companyObj.rating - reviewObj.rating;
                db.Companies.findOneAndUpdate(
                  { _id: companyObj._id },
                  { $inc: { noOfReviews: -1 }, rating: new_rating }
                ).then((a) => {});
              }
            }
          );
        })
        .catch((err) => {
          logError(err.msg, err);
          res.json({
            status: "failed",
            msg: "Sorry Something went wrong. Please try again",
          });
        });
    } else {
      res.json({ status: "failed", msg: "Review id missing" });
    }
  },
  deleteUser: function (req, res) {
    db.User.findOneAndRemove({ _id: req.params.userId })
      .then((user) => {
        res.json({ status: "sucess", msg: "sucessfully deleted the user" });
      })
      .catch((err) => {
        logError(err.msg, err);
        res.json({
          status: "failed",
          msg: "Sorry Something went wrong. Please try again",
        });
      });
  },
  getCompanyList: function (req, res) {
    let lookup=
    db.Companies.find({})
      .then((list) => {
        let new_list = [];
        list.forEach((obj) => {
          new_list.push(obj.name);
        });
        res.json({ status: "sucess", list: new_list });
      })
      .catch((err) => {
        res.json({ status: "failed", list: [] });
      });
  },
  getCollegeList:function(req,res){
    let lookup = {from: "reviews",localField: "_id",foreignField: "collegeId",as: "reviews"};  
    let lookup2 = {from: "users",localField: "_id",foreignField: "collegeId",as: "users"};  


    // let group=  {_id:"$reviews","numOfReviews":{$sum:1},user:{ "$push": "$$ROOT" }}
    let addField={ $addFields: {noOfReviews: {$size: "$reviews"},noOfUsers: {$size: "$users"}}}

    db.Colleges.aggregate([{$lookup:lookup},{$lookup:lookup2},addField,{$unset:"reviews"},{$unset:"users"}])
      .then((list) => {
        res.json({ status: "sucess", list: list });
      })
      .catch((err) => {
        res.json({ status: "failed", list: [] });
      });
  },
  getCollegeData:function(req,res){
    if(req.params.collegeId){
      let match={_id: mongoose.Types.ObjectId(req.params.collegeId)}
      let lookup = {from: "reviews",localField: "_id",foreignField: "collegeId",as: "reviews"};  
      let lookup2 = {from: "users",localField: "_id",foreignField: "collegeId",as: "users"};  
  
  
      // let group=  {_id:"$reviews","numOfReviews":{$sum:1},user:{ "$push": "$$ROOT" }}
      let addField={ $addFields: {noOfReviews: {$size: "$reviews"},noOfUsers: {$size: "$users"}}}
  
      db.Colleges.aggregate([{$match:match},{$lookup:lookup},{$lookup:lookup2},addField,{$unset:"reviews"},{$unset:"users"}])
        .then((list) => {
          res.json({ status: "sucess", college: list[0] });
        })
        .catch((err) => {
          res.json({ status: "failed", list: [] });
        });
    }
  },
  updateCollegeData:function(req,res){
    if(req.params.collegeId && req.body.college_name && req.body.college_rating && req.body.college_reviews){
    
      db.Colleges.findOneAndUpdate({_id:req.params.collegeId},{name:req.body.college_name})
      .then((college)=>{
        res.json({
          status: "sucess",
          msg:"Sucessfully updated"
        });
      })
      .catch((err)=>{
        res
        .send(500)
        .json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
      })
    }else{
      res
        .send(500)
        .json({
          status: "failure",
          message: "Some Error Occured. Try Again!",
        });
    }
  },

  deleteCollege: function (req, res) {
    if (req.params.collegeId) {
      db.Colleges.findOneAndRemove({ _id: req.params.collegeId })
        .then((collegeObj) => {
          res.json({ status: "sucess", msg: "sucessfully deleted college" });
        })
        .catch((err) => {
          logError(err.msg, err);
          res.json({
            status: "failed",
            msg: "Sorry Something went wrong. Please try again",
          });
        });
    } else {
      res.json({ status: "failed", msg: "company id missing" });
    }
  },
  deleteUserReview: function (req, res) {
    if (req.params.reviewId) {
      db.Reviews.findOneAndRemove({ _id: req.params.reviewId })
        .then((reviewObj) => {
          res.json({
            status: "sucess",
            msg: "sucessfully deleted your review",
          });
          db.Companies.findOne({ _id: reviewObj.companyId }).then(
            (companyObj) => {
              if (companyObj) {
                sendReport(
                  `new review deleted for ${companyObj.name} by admin`
                );

                let new_rating = companyObj.rating - reviewObj.rating;
                db.Companies.findOneAndUpdate(
                  { _id: companyObj._id },
                  { $inc: { noOfReviews: -1 }, rating: new_rating }
                ).then((a) => {});
              }
            }
          );
        })
        .catch((err) => {
          logError(err.msg, err);
          res.json({
            status: "failed",
            msg: "Sorry Something went wrong. Please try again",
          });
        });
    } else {
      res.json({ status: "failed", msg: "Review id missing" });
    }
  },
  getUserReviews: function (req, res) {
    let match={ userId: mongoose.Types.ObjectId(req.params.userId) };
    let lookup = {from: "companies",localField: "companyId",foreignField: "_id",as: "company"};  
    let lookup2 = {from: "users",localField: "userId",foreignField: "_id",as: "user"};  
      
    db.Reviews
      .aggregate([{$match: match},{ $lookup: lookup },{ $lookup: lookup2 }])
      .then(async (reviews) => {
        res.json({ status: "success", reviews: reviews });
      })
      .catch((err) => {
        console.log(err)
        res.json({ status: "failed", msg: "Something went wrong" });
      });
  },
  getUserReview: function (req, res) {
    db.Reviews.findOne({ _id: req.params.reviewId })
      .then((review) => {
        db.Companies.findOne({ _id: review.companyId })
          .then((company) => {
            if (company) {
              review._doc.name = company.name;
              res.json({ status: "sucess", review: review });
            } else {
              res.json({ status: "failed", msg: "Something went wrong" });
            }
          })
          .catch((err) => {
            res.json({ status: "failed", msg: "Something went wrong" });
          });
      })
      .catch((err) => {
        res.json({ status: "failed", msg: "Something went wrong" });
      });
  },
  verifiyMyEmail: async function (req, res) {
    let user_id = req.params.userId;
    if (user_id) {
      var user = await db.User.findOne({
        _id: user_id,
      });
      if (user) {
        user.is_email_verified = true;
        new_user = await user.save();
        res.json({ status: "sucess" });
        return;
      }
      res.json({ status: "failed" });
    }
  },
  deleteCompany: function (req, res) {
    if (req.params.companyId) {
      db.Companies.findOneAndRemove({ _id: req.params.companyId })
        .then((companyObj) => {
          res.json({ status: "sucess", msg: "sucessfully deleted company" });
          db.Reviews.findOneAndRemove({ companyId: companyObj._id }).then(
            (reviewObj) => {
              if (companyObj) {
                sendReport(
                  `new company deleted for ${companyObj.name} by admin`
                );
              }
            }
          );
        })
        .catch((err) => {
          logError(err.msg, err);
          res.json({
            status: "failed",
            msg: "Sorry Something went wrong. Please try again",
          });
        });
    } else {
      res.json({ status: "failed", msg: "company id missing" });
    }
  },
};

module.exports = admin;
