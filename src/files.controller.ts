import {Controller, Post, UploadedFile, UseInterceptors} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
// import {diskStorgae} from 'multer';

@Controller('files')
export class FilesController{
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file) {
        if(file) {
            
            console.log('file uploaded', file)
            return {message: 'File Uploaded'}
           
            
        }
        else if(Error) {
            console.log(Error)
        }
       
    }
}