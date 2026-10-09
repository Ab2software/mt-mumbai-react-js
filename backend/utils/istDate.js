// Helper functions for India Standard Time (IST / Asia/Kolkata / UTC+5:30)

/**
 * Returns a JS Date object set to current IST date & time
 */
function getISTDate(d = new Date()) {
  const istString = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

/**
 * Returns YYYY-MM-DD date string in IST
 */
function getISTDateStr(d = new Date()) {
  const ist = getISTDate(d);
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const dd = String(ist.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns HH:MM:SS (24-hour) time string in IST
 */
function getISTTimeStr(d = new Date()) {
  const ist = getISTDate(d);
  const hh = String(ist.getHours()).padStart(2, '0');
  const mm = String(ist.getMinutes()).padStart(2, '0');
  const ss = String(ist.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Returns hh:mm:ss AM/PM (12-hour) time string in IST
 */
function getISTTime12h(d = new Date()) {
  const ist = getISTDate(d);
  return ist.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

/**
 * Returns YYYY-MM-DD HH:MM:SS datetime string in IST
 */
function getISTDateTimeStr(d = new Date()) {
  return `${getISTDateStr(d)} ${getISTTimeStr(d)}`;
}

module.exports = {
  getISTDate,
  getISTDateStr,
  getISTTimeStr,
  getISTTime12h,
  getISTDateTimeStr
};
