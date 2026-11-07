(() => {
  "use strict";

  if ("commandForElement" in HTMLButtonElement.prototype || typeof HTMLDialogElement === "undefined") {
    return;
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest("button[commandfor][command]");
    if (!button || button.matches(":disabled")) {
      return;
    }

    const command = button.getAttribute("command");
    if (command !== "show-modal" && command !== "close") {
      return;
    }

    const dialog = document.getElementById(button.getAttribute("commandfor"));
    if (!(dialog instanceof HTMLDialogElement)) {
      return;
    }

    event.preventDefault();
    if (command === "show-modal" && !dialog.open) {
      dialog.showModal();
    } else if (command === "close" && dialog.open) {
      dialog.close();
    }
  });
})();
