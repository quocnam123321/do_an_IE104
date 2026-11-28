if (location.protocol === "file:") {
  const loader = document.currentScript;
  for (const name of loader.dataset.scripts.split(" ")) {
    const script = document.createElement("script");
    script.src = new URL(name, loader.src);
    document.head.append(script);
  }
}
