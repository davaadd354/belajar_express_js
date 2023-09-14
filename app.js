// https://github.com/atomdeniz/nodejs-mp4-to-hls
const express = require('express')
const app = express()
const PORT = 3000
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const fs = require('fs')

const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
// var filename = 'videos/testing.mp4'
 
// Single routing
const router = express.Router()

router.use(fileUpload({useTempFiles: true}))
 
app.use(router)
app.use(bodyParser.urlencoded({extended:true}))

app.set('view engine', 'ejs')
app.use(fileUpload({useTempFiles: true}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));

const {
    S3Client,
    PutObjectCommand,
    S3
  } = require("@aws-sdk/client-s3")

const AWS3 = require('@aws-sdk/client-s3')
const path = require('path')

var endpoint = 'https://is3.cloudhost.id/'
var bucket = 'tasktiten'



  const s3 = new AWS3.S3({
    region : 'Global',
    endpoint : endpoint,
    credentials : {
        accessKeyId : 'J0GTOC4SLNUM70J234WU',
        secretAccessKey : 'yTd4sQGbD4VTblqyejiCv09HF5b1ZcSFhPYyi2qm'
    },
    
  })


router.get('/', function (req, res) {
    return res.status(200).json({
      message : 'Ini adalah project express js'
    })
})

router.post("/upload", async (req, res) => {
    console.log(req.files.file.name)
    const file = req.files.file
    const fileName = req.files.file.name
    let arr_filename = req.files.file.name.split(".")
    let ext = arr_filename[arr_filename.length - 1]
    let nama_file = arr_filename[arr_filename.length - 2]

    let path = 'testing/' + nama_file + Math.floor((Math.random() * 1001238912) + 100000) + '.' + ext

    var fileStream = fs.createReadStream(req.files.file.tempFilePath)
    
    const bucketParams = {
      Bucket: bucket,
      Key: path,
      Body: fileStream,
      ContentType: req.files.file.mimetype,
      ACL: "public-read"
    }
    try {
      const data = s3.send(new PutObjectCommand(bucketParams))
      console.log('berhasil')
      res.send({
        url : endpoint + bucket + '/' + path
      })
    } catch (err) {
      console.log("Error", err)
    }
  })

router.post("/convert-video", async(req, res)=>{
  var filePath = req.files.file.tempFilePath
  let arr_filename = req.files.file.name.split(".")
  let ext = arr_filename[arr_filename.length - 1]
  let nama_file = arr_filename[arr_filename.length - 2].replace(/\s/g, '')

  function callback() {
    fs.writeFile("videos/testing/testing.m3u8", '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p.m3u8', function (err) {
            if (err) {
                return console.log(err)
            }
            console.log("The file was saved!")
            return res.status(200).json('berhasil convert video')
        })
  }

  console.log(nama_file)
  console.log(ext)

  if (!fs.existsSync('./videos/' + nama_file)){
      fs.mkdirSync('./videos/' + nama_file, { recursive: true })
  }

    ffmpeg(filePath).addOptions([ //360
        '-profile:v main',
        '-vf scale=w=640:h=360:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 96k',
        '-c:v h264',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 800k',
        '-maxrate 856k',
        '-bufsize 1200k',
        '-hls_time 10',
        `-hls_segment_filename ./videos/${nama_file}/360p_%03d.ts`,
        '-hls_playlist_type vod',
        '-f hls'
    ])
    .output(`videos/${nama_file}/360p.m3u8`)
    .run()

    ffmpeg(filePath).addOptions([ //480
        '-profile:v main',
        '-vf scale=w=842:h=480:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
        '-c:v h264',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 1400k',
        '-maxrate 1498k',
        '-bufsize 2100k',
        '-hls_time 10',
        `-hls_segment_filename videos/${nama_file}/480p_%03d.ts`,
        '-hls_playlist_type vod',
        '-f hls'
    ]).output(`videos/${nama_file}/480p.m3u8`).run()

    ffmpeg(filePath).addOptions([ //720
        '-profile:v main',
        '-vf scale=w=1280:h=720:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
        '-c:v h264',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 2800k',
        '-maxrate 2996k',
        '-bufsize 4200k',
        '-hls_time 10', 
        `-hls_segment_filename videos/${nama_file}/720p_%03d.ts`,
        '-hls_playlist_type vod',
        '-f hls' 
    ]).output(`videos/${nama_file}/720p.m3u8`).on('end', ()=>{
      fs.writeFile(`videos/${nama_file}/${nama_file}.m3u8`, '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p.m3u8', function (err) {
          if (err) {
              return res.status(200).json(err)
          }

          fs.readdir(`./videos/${nama_file}/`, (err, files)=>{
            if(err){
              return res.status(400).json('Transcoding failed')
            }else{
              console.log("\nCurrent directory filenames:")
              files.forEach(file => {
                console.log(file)
                data_file = `./videos/${nama_file}/${file}`
                var fileStream = fs.createReadStream(data_file)

                const bucketParams = {
                  Bucket: bucket,
                  Key: `testing/${nama_file}/${file}`,
                  Body: fileStream,
                  ACL: "public-read"
                }
              
                try {
                  s3.send(new PutObjectCommand(bucketParams))
                } catch (err) {
                  console.log("Error", err)
                  return res.status(400).json('gagal')
                }

              })
              return res.status(200).json('Berhasil')
            }
          })
      })
    }).run()

})

router.post('/upload-testing', (req,res)=>{
  var file = './videos/testing/360p_019.ts'
  var fileStream = fs.createReadStream(file)

  const bucketParams = {
    Bucket: bucket,
    Key: 'testing/360p_019.ts',
    Body: fileStream,
    ACL: "public-read"
  }

  try {
    const data = s3.send(new PutObjectCommand(bucketParams))
    console.log('berhasil')
    return res.status(200).json('berhasil')
  } catch (err) {
    console.log("Error", err)
    return res.status(400).json('gagal')
  }


})

router.get('/test', (req,res)=>{
  return res.status(200).json({
    message : 'LOREM IPSUM DOLOR SIT AMET'
  });
})
 
app.listen(PORT, function (err) {
    if (err) console.log(err)
    console.log("Server listening on PORT", PORT)
})