import './App.css';
import React, {useEffect, useState} from "react";
import axios from "axios";

const chunkSize = 1024 * 10

function App() {
    const [dropzoneActive, setDropzoneActive] = useState(false)
    const [files, setFiles] = useState([])
    const [currentFileIndex, setCurrentFileIndex] = useState(null)
    const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null)
    const [currentChunkIndex, setCurrentChunkIndex] = useState(null)
    const handelDrop = (e) => {
        e.preventDefault()
        setFiles(i => [...i, ...e.dataTransfer.files])
    }
    const readAndUploadCurrentChunk = () => {
        const reader = new FileReader()
        const file = files[currentFileIndex]
        console.log(file)
        if (!file) {
            return
        }
        const from = currentChunkIndex * chunkSize
        const to = from + chunkSize
        console.log(file)
        const blob = file.slice(from, to)
        reader.onload = e => uploadChunk(e)
        reader.readAsDataURL(blob)
    }
    const uploadChunk = async (readerEvent) => {
        const file = files[currentFileIndex]
        const data = readerEvent.target.result.split(',')[1];
        const params = new URLSearchParams()
        params.set('name', file.name)
        params.set('size', file.size)
        params.set('currentChunkIndex', currentChunkIndex?.toString())
        params.set('totalChunks', String(Math.ceil(file.size / chunkSize)))
        const headers = {'Content-Type': 'application/octet-stream'}
        const url = 'http://localhost:5000/upload?' + params.toString()

        await axios.post(url, data, {headers}).then(response => {
            const file = files[currentFileIndex]
            const fileSize = files[currentFileIndex].size
            const isLastChunk = currentChunkIndex === Math.ceil(fileSize / chunkSize) - 1
            if (isLastChunk) {
                file.finalFilename = response.data.finalFilename;
                setLastUploadedFileIndex(currentFileIndex)
                setCurrentChunkIndex(null)
            } else {
                setCurrentChunkIndex(i => i + 1)
            }
        })
    }
    useEffect(() => {
        if (lastUploadedFileIndex === null) {
            return
        }
        const isLastFile = lastUploadedFileIndex === files.length - 1
        const nextFileIndex = isLastFile ? null : currentFileIndex + 1
        setCurrentFileIndex(nextFileIndex)

    }, [lastUploadedFileIndex])
    useEffect(() => {
        if (files.length > 0) {
            if (currentFileIndex === null) {

                setCurrentFileIndex(lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1)

            }
        }
    }, [files.length])
    useEffect(() => {
        if (currentFileIndex !== null) {
            setCurrentChunkIndex(0)

        }
    }, [currentFileIndex])
    useEffect(() => {
        if (currentFileIndex !== null) {
            readAndUploadCurrentChunk()
        }
    }, [currentChunkIndex])
    return (
        <div>
            <div
                onDragOver={e => {
                    setDropzoneActive(true)
                    e.preventDefault()
                }}
                onDragLeave={e => {
                    setDropzoneActive(false)
                    e.preventDefault()
                }}
                onDrop={handelDrop}
                className={"dropzone" + (dropzoneActive ? " active" : "")}>
                Перетащите ваши файлы сюда
            </div>
            <div className="files">
                {files.map((f, idx) => {
                    let progress = 0
                    if (f.finalFilename) {
                        progress = 100

                    } else {
                        const uploading = idx === currentFileIndex
                        const chunks = Math.ceil(f.size / chunkSize)
                        if (uploading) {
                            progress = Math.round(currentChunkIndex / chunks * 100)
                        } else {
                            progress = 0
                        }
                    }
                    return (
                        <a className={'file'} key={idx} target='_blank'
                           href={`http://localhost:5000/uploads/${f.finalFilename}`}>
                            <div className="name">
                                {f.name}
                            </div>
                            <div className={"progress " + (progress === 100 ? 'done' : '')}
                                 style={{width: progress + '%'}}>{progress}%
                            </div>
                        </a>
                    )
                })}
            </div>
        </div>
    );
}

export default App;
