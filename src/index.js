import 'image-capture'

import './createImageBitmap';
import * as serviceWorker from './serviceWorker';



const width = 320;
const height = 240;

async function getVideoDevice() {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
    const videoDevice = videoDevices[0];
    console.log(`Video device selected: ${videoDevice.deviceId}`);
    return videoDevice;
}

async function getVideoStream() {
    const videoStream = await navigator.mediaDevices.getUserMedia({video: true});
    console.log(`Video stream opened: ${videoStream.id}`);
    return videoStream;
}

function createVideoTag(videoStream) {
    const video = document.createElement("video");
    document.body.appendChild(video);
    video.width = width;
    video.height = height;
    video.srcObject = videoStream;
    video.onloadedmetadata = () => {
        video.play();
        console.log(`Video playing`);
    };
    return video;
}

function createCanvasTag() {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function getImageCapture(videoStream) {
    const videoTrack = videoStream.getVideoTracks()[0];
    return new ImageCapture(videoTrack);
}

const dummyBlob = new Blob(['Tiny content'], {type: 'image/png'});

async function sendNewPhoto(webSocket, imageCapture) {
    const blob = await imageCapture.takePhoto();
    // --- real photo is too large ---
    // ws.send(blob);
    // --- sending dummy instead ---
    window.tmp = blob;
    webSocket.send(dummyBlob);
}

async function toPhoto(blob) {
    // --- echo service returns dummy photo ---
    // return createImageBitmap(blob);
    // --- using real one instead
    return createImageBitmap(window.tmp);
}

(async function demo() {

    const videoStream = await getVideoStream();

    const imageCapture = getImageCapture(videoStream);

    createVideoTag(videoStream);
    const canvas2dContext = createCanvasTag()
        .getContext('2d');

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const webSocket = new WebSocket(`${wsProtocol}://demos.kaazing.com/echo`);
    webSocket.binaryType = 'blob';
    webSocket.onopen = async () => {
        console.log(`Web socked opened`);
        await sendNewPhoto(webSocket, imageCapture);
    };
    webSocket.onmessage = async ({data}) => {
        const photo = await toPhoto(data);
        canvas2dContext.drawImage(photo, 0, 0, width, height);
        await sendNewPhoto(webSocket, imageCapture);
    };
    webSocket.onclose = () => {
        console.log(`Web socked closed`);
    };

})();



// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
