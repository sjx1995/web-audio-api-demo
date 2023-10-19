/*
 * @Description:
 * @Author: Sunly
 * @Date: 2023-10-19 03:30:59
 */
const inputEle = document.querySelector("#input");

inputEle.addEventListener("change", () => {
  if (inputEle.files.length) {
    const file = inputEle.files[0];
    if (!file.type.includes("audio/")) {
      alert("请上传合法的音频文件");
      inputEle.value = "";
      return;
    }

    if (!window.AudioContext) {
      alert("您的浏览器不支持audio api");
      return;
    }

    readAsArrayBuf(file);
  }
});

// 将音乐读取为buffer
function readAsArrayBuf(file) {
  const fr = new FileReader();
  fr.onload = () => {
    if (fr.result) {
      playBuffer(fr.result);
    }
  };
  fr.readAsArrayBuffer(file);
}

// 创建audioContext
const audioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new audioContext();
const createTime = new Date().getTime();
let intervalTime = 0;
let totalTime = 0;
// 创建audioNode
const sourceNode = ctx.createBufferSource();
const gainNode = ctx.createGain();
const pannerNode = ctx.createPanner();
const analyserNode = ctx.createAnalyser();

// 音量
const volumeEle = document.querySelector("#volume");
volumeEle.value = "0.5";
gainNode.gain.value = 0.5;
volumeEle.addEventListener("input", () => {
  gainNode.gain.value = parseFloat(volumeEle.value);
});

// 播放音乐
function playBuffer(arrayBuf) {
  ctx.decodeAudioData(arrayBuf, (buf) => {
    showDuration(buf);
    showRate(buf);

    sourceNode.buffer = buf;

    gainNode.gain.value = 0.5;

    sourceNode.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    play();
  });
}

// 显示总时间
function showDuration(buf) {
  totalTime = buf.duration;
  let min = ~~(buf.duration / 60);
  min = min < 10 ? `0${min}` : min;
  let sec = parseInt(buf.duration % 60);
  sec = sec < 10 ? `0${sec}` : sec;
  const durationEle = document.querySelector("#music-total");
  durationEle.innerHTML = `${min}:${sec}`;
}

// 显示采样率
function showRate() {
  const rateEle = document.querySelector("#sample-rate");
  rateEle.innerHTML = `采样率: ${ctx.sampleRate}Hz`;
}

// 显示当前进度
let lastTime = -1;
function trackProcess() {
  const cur = ctx.currentTime - intervalTime / 1000;
  if (cur > totalTime) {
    return;
  }
  const time = cur <= 0 ? 0 : ~~cur;
  if (time !== lastTime) {
    let min = ~~(time.duration / 60);
    min = min < 10 ? `0${min}` : min;
    let sec = parseInt(time % 60);
    sec = sec < 10 ? `0${sec}` : sec;
    const curEle = document.querySelector("#music-current");
    curEle.innerHTML = `${min}:${sec}`;
    lastTime = time;
  }
  requestAnimationFrame(trackProcess);
}

// 播放
// document.querySelector("#play").addEventListener("click", () => {
//   play();
// });
function play() {
  sourceNode.start(0);
  intervalTime = new Date().getTime() - createTime;
  trackProcess();
}

// 移动小球
const pEle = document.querySelector("#pos-container");
const cEle = document.querySelector("#cur-pos");
let isMoving = false;
let circleX = 0;
let circleY = 0;
cEle.addEventListener("mousedown", (e) => {
  isMoving = true;
  const { offsetX, offsetY } = e;
  circleX = offsetX;
  circleY = offsetY;
});
cEle.addEventListener("mouseup", () => {
  isMoving = false;
});
pEle.addEventListener("mousemove", (e) => {
  if (isMoving && e.target === pEle) {
    const { offsetX, offsetY } = e;

    let left = offsetX - circleX;
    let top = offsetY - circleY;

    if (left < 0 || left > 380 || top < 0 || top > 380) {
      isMoving = false;
      left = left < 0 ? 0 : left > 380 ? 380 : left;
      top = top < 0 ? 0 : top > 380 ? 380 : top;
    }

    pannerNode.positionX.value = left - 190;
    pannerNode.positionY.value = top - 190;
    console.log(pannerNode);
    cEle.setAttribute("style", `left: ${left}px; top: ${top}px;`);
  }
});
