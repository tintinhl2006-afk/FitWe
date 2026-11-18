/**
 * Abre el puerto serie de un lector y entrega cada lectura como una línea de texto. Si el lector
 * se desconecta (cable, reinicio del PC), reintenta solo cada pocos segundos.
 * `serialport` se carga aquí dentro para que el resto del programa se pueda probar sin él.
 */
const { createLineSplitter } = require("./scanner");

const RETRY_MS = 5000;

function openReader(reader, onLine, log = console) {
  let closed = false;
  let timer = null;
  let port = null;

  function connect() {
    if (closed) return;
    const { SerialPort } = require("serialport");
    port = new SerialPort({ path: reader.port, baudRate: reader.baudRate, autoOpen: false });
    port.on("data", createLineSplitter(onLine));
    port.on("error", (err) => log.error(`[${reader.name}] error del puerto ${reader.port}: ${err.message}`));
    port.on("close", () => {
      if (closed) return;
      log.warn(`[${reader.name}] puerto ${reader.port} cerrado; reintentando en ${RETRY_MS / 1000} s`);
      timer = setTimeout(connect, RETRY_MS);
    });
    port.open((err) => {
      if (err) {
        log.warn(`[${reader.name}] no se pudo abrir ${reader.port}: ${err.message}; reintentando en ${RETRY_MS / 1000} s`);
        timer = setTimeout(connect, RETRY_MS);
      } else {
        log.info(`[${reader.name}] escuchando en ${reader.port} a ${reader.baudRate} baudios`);
      }
    });
  }

  connect();
  return {
    close() {
      closed = true;
      clearTimeout(timer);
      if (port && port.isOpen) port.close();
    },
  };
}

async function listPorts() {
  const { SerialPort } = require("serialport");
  return SerialPort.list();
}

module.exports = { openReader, listPorts };
