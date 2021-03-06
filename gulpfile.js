const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const path = require('path');
const pump = require('pump');
const config = require('./webpack.config.js');
const webpack = require('webpack');


gulp.task('webpack', function(cb){
  webpack(config, function(err, stats){
    if(err) throw err;
  });
  cb();
});

gulp.task('default', ['webpack'], function(cb){
  return nodemon({
    delay: 10,
    ignore: ['public/**/*.*'],
    scripts: {
      start: 'node app.js'
    },
    tasks: ['webpack'],
    watch: '**/*.*'
  });
});
