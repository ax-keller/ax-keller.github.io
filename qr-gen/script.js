const textInput = document.getElementById("text-input");
const formatSelect = document.getElementById("format-select");
const styleSelect = document.getElementById("style-select");
const cornerStyleSelect = document.getElementById("corner-style-select");
const sizeInput = document.getElementById("size-input");
const previewEl = document.getElementById("qr-preview");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const toastEl = document.getElementById("toast");

const PREVIEW_SIZE = 300;

let qr = null;

function createQR() {
  const text = textInput.value.trim();
  const format = formatSelect.value;
  const style = styleSelect.value;
  const cornerStyle = cornerStyleSelect.value;

  const isSvg = format === "svg";

  qr = new QRCodeStyling({
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    type: isSvg ? "svg" : "canvas",
    data: text || "https://example.com",
    dotsOptions: {
      color: "#000000",
      type: style,
    },
    cornersSquareOptions: {
      color: "#000000",
      type: cornerStyle,
    },
    cornersDotOptions: {
      color: "#000000",
      type: cornerStyle,
    },
    backgroundOptions: {
      color: format === "jpeg" ? "#ffffff" : "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 4,
      imageSize: 0.3,
    },
    qrOptions: {
      errorCorrectionLevel: "M",
    },
    svgOptions: {
      margin: 0,
    },
  });

  previewEl.innerHTML = "";
  qr.append(previewEl);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2000);
}

async function download() {
  const text = textInput.value.trim();
  if (!text) {
    showToast("Enter text first");
    return;
  }

  const format = formatSelect.value;
  const size = parseInt(sizeInput.value, 10) || 300;
  const filename = `qr_output.${format === "jpeg" ? "jpg" : format}`;

  if (format === "svg") {
    const blob = await qr.getRawData("svg");
    downloadBlob(blob, filename);
  } else {
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
    }

    const img = new Image();
    const blob = await qr.getRawData(format === "jpeg" ? "jpeg" : "png");

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        downloadBlob(blob, filename);
      }, mime);
    };

    img.src = URL.createObjectURL(blob);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Saved as ${filename}`);
}

async function copyToClipboard() {
  const text = textInput.value.trim();
  if (!text) {
    showToast("Enter text first");
    return;
  }

  const format = formatSelect.value;
  const size = parseInt(sizeInput.value, 10) || 300;

  try {
    if (format === "svg") {
      const blob = await qr.getRawData("svg");
      const item = new ClipboardItem({ "image/svg+xml": blob });
      await navigator.clipboard.write([item]);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
      }

      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const blob = await qr.getRawData(format === "jpeg" ? "jpeg" : "png");
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      ctx.drawImage(img, 0, 0, size, size);

      const blobOut = await new Promise((resolve) =>
        canvas.toBlob(resolve, mime)
      );

      const item = new ClipboardItem({ [mime]: blobOut });
      await navigator.clipboard.write([item]);
    }

    showToast("Copied to clipboard");
  } catch (err) {
    showToast("Copy failed — try downloading instead");
    console.error(err);
  }
}

let debounceTimer;
function onInputChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    createQR();
  }, 150);
}

textInput.addEventListener("input", onInputChange);
formatSelect.addEventListener("change", createQR);
styleSelect.addEventListener("change", createQR);
cornerStyleSelect.addEventListener("change", createQR);
downloadBtn.addEventListener("click", download);
copyBtn.addEventListener("click", copyToClipboard);

createQR();
