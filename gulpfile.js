const { watch, src, dest, parallel } = require('gulp')
const rename = require('gulp-rename')
const bundle = require('gulp-esbuild')
const connect = require('gulp-connect')

const copyWorkspaceTemplate = async () => {
  return src('./src/workspace/index.html')
    .pipe(rename({ dirname: '' }))
    .pipe(dest('./.serve'))
}

const buildWorkspaceScript = async () => {
  return src('./src/workspace/index.ts')
    .pipe(bundle({
        outfile: 'bundle.js',
        bundle: true,
        loader: {
          '.mustache': 'text',
        },
        treeShaking: true,
        sourcemap: true,
        target: "es6",
        charset: 'utf8',
    }))
    .pipe(dest('./.serve'))
}

const buildLib = async () => {
  return src('./src/lib/index.ts')
    .pipe(bundle({
        outfile: 'bundle.js',
        bundle: true,
        treeShaking: true,
        sourcemap: true,
        target: "es6",
        charset: 'utf8',
    }))
    .pipe(dest('./dist'))
}

exports.default = buildLib

const serve = async () => {
  await buildWorkspaceScript()
  await copyWorkspaceTemplate()
  connect.server({
    root: './.serve',
    livereload: true,
    port: 8080,
  })
}

const listen = async () => {
  watch([
    './src/lib/**/*.ts',
    './src/workspace/*.html',
    './src/workspace/**/*.ts',
    './src/workspace/**/*.css',
    './src/workspace/**/*.mustache',
    './src/workspace/**/*.html'
  ]).on('change', async (path) => {
    await buildWorkspaceScript()
    return src(path, { read: false }).pipe(connect.reload())
  })
}

exports.dev = parallel(serve, listen)