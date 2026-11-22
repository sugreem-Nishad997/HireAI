import mammoth from 'mammoth';
import {PDFParse} from 'pdf-parse';

export const extractResumeText = async(file) => {
    if(!file.buffer) {
        throw new Error('File buffer is missing');
    }

    let text = '';

    if(file.mimetype === 'application/pdf') {
        const parser = new PDFParse({
            data: file.buffer,
        });

        try{
            const result = await parser.getText();
            text = result.text;
        }finally{
            await parser.destroy();
        }
    }else if(file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
       const result = await mammoth.extractRawText({
        buffer: file.buffer,
       });

       text = result.value;
    }else{
        throw new Error('Unsupported file type. Only PDF and DOCX are allowed.');
    }

    text = text.trim();

    if(!text) {
        throw new Error('No readable text found. The PDF may be scanned or image-based.');
    }

    return text;
}