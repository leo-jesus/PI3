class View {
  constructor() {
    this.recorderBtn = document.getElementById("record");
  }

  //para criar o elemento de vídeo dentro do HTML

  createVideoElement({ muted = true, src, srcObject }) {
    const video = document.createElement("video"); // estamos trabalhando com vídeo ativo, sempre recebendo informações, por isso o srcObject

    video.muted = muted;
    video.src = src;
    video.srcObject = srcObject;

    if (src) {
      video.controls = true;
      video.loop = true;
      Util.sleep(200).then((_) => video.play());
    }

    if (srcObject) {
      video.addEventListener("loadedmetadata", (_) => video.play());
    }

    return video;
  }

  renderVideo({
    userId,
    stream = null,
    url = null,
    muted = true,
    isCurrentId = false,
  }) {
    const video = this.createVideoElement({
      src: url,
      muted,
      srcObject: stream,
    });
    this.appendToHTMLTree(userId, video, isCurrentId);
  }

  appendToHTMLTree(userId, video, isCurrentId) {
    const div = document.createElement("div");
    div.id = userId;
    div.classList.add("wrapper");
    div.append(video);
    const div2 = document.createElement("div");
    div2.innerText = isCurrentId ? "" : userId;
    div.append(div2);

    const videoGrid = document.getElementById("video-grid");
    videoGrid.append(div);
  }
  setParticipants(count) {
    const myself = 1;
    const participants = document.getElementById("participants");
    participants.innerHTML = count + myself;
  }
  removeVideoElement(id) {
    const element = document.getElementById(id);
    element.remove();
  }
  toogleRecordingButtonColor(isActive = true) {
    this.recorderBtn.style.color = isActive ? "red" : "white";
  }

  onRecordClick(command) {
    this.recordingEnabled = false;
    return () => {
      const isActive = (this.recordingEnabled = !this.recordingEnabled);
      command(this.recordingEnabled);
      this.toogleRecordingButtonColor(isActive);
    };
  }
  configureRecordButton(command) {
    this.recorderBtn.addEventListener("click", this.onRecordClick(command));
  }
}
