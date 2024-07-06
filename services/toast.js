const toast = (text) =>
  Toastify({
    text: text,
    duration: 2000,
    newWindow: true,
    close: true,
    gravity: "bottom", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #fe53bb, #8f51ea)",
      borderRadius: "3px",
    },
    className: "info",
    onClick: function () {}, // Callback after click
  }).showToast();

export default toast;
