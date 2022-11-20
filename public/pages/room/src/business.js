//controla toda a regra de negócio

class Business {
  constructor({ room, media, view, socketBuilder, peerBuilder }) {
    this.room = room;
    this.media = media;
    this.view = view;

    this.socketBuilder = socketBuilder;
    this.peerBuilder = peerBuilder;

    this.socket = {};
    this.currentStream = {};
    this.currentPeer = {};

    this.peers = new Map();
    this.usersRecodings = new Map();
  }
  static initialize(deps) {
    const instance = new Business(deps);
    return instance._init();
  }

  async _init() {
    this.view.configureRecordButton(this.onRecordPressed.bind(this));

    this.currentStream = await this.media.getCamera();
    this.socket = this.socketBuilder
      .setOnUserConnected(this.onUserConnected())
      .setOnUserDisconnected(this.onUserDisconnected())
      .build();

    this.currentPeer = await this.peerBuilder
      .setOnError(this.onPeerError())
      .setOnConnectionOpened(this.onPeerConnectionOpened())
      .setOnCallReceived(this.onPeerCallReceived())
      .setOnPeerStreamReceived(this.onPeerStreamReceived())
      .setOnCallError(this.onPeerCallError())
      .setOnCallClose(this.onPeerCallClose())
      .build();

    this.addVideoStream(this.currentPeer.id);
  }

  addVideoStream(userId, stream = this.currentStream) {
    const recorderInstance = new Recorder(userId, stream);
    this.usersRecodings.set(recorderInstance.filename, recorderInstance);
    if (this.recorderEnabled) {
      recorderInstance.startRecording();
    }

    const isCurrentId = false;
    this.view.renderVideo({
      userId,
      stream,
      isCurrentId,
    });
  }

  onUserConnected = function () {
    return (userId) => {
      console.log("user connected!", userId);
      this.currentPeer.call(userId, this.currentStream);
    };
  };

  onUserDisconnected = function () {
    return (userId) => {
      console.log("user disconnected!", userId);

      if (this.peer.has(userId)) {
        this.peer.get(userId).call.close();
        this.peer.delete(userId);
      }

      this.view.setParticipants(this.peers.size);
      this.view.removeVideoElement(userId);
    };
  };

  onPeerError = function () {
    return (error) => {
      console.error("error on peer!", error);
    };
  };
  onPeerConnectionOpened = function () {
    return (peer) => {
      const id = peer.id;
      console.log("peer!!", peer);
      this.socket.emit("join-room", this.room, id);
    };
  };
  onPeerCallReceived = function () {
    return (call) => {
      console.log("answering call", call);
      call.answer(this.currentStream);
    };
  };

  onPeerStreamReceived = function () {
    return (call, stream) => {
      const callerId = call.peer;
      this.addVideoStream(callerId, stream);
      this.peers.set(callerId, { call });

      this.view.setParticipants(this.peers.size);
    };
  };

  onPeerCallError = function () {
    return (call, error) => {
      console.log("an call error ocurred!", error);
      this.view.removeVideoElement(call.peer);
    };
  };
  onPeerCallClose = function () {
    return (call) => {
      console.log("an call was closed!", call.peer);
    };
  };
  onRecordPressed = function (recordingEnabled) {
    this.recordingEnabled = recordingEnabled;
    console.log("gravando", recordingEnabled);

    for (const [key, value] of this.usersRecodings) {
      if (this.recordingEnabled) {
        value.startRecording();
        continue;
      }
      this.stopRecording(key);
    }
  };

  //se o usuario alguém entrou e saiu da call durante uma gravação, é preciso para todas as gravações dele
  async stopRecording(key) {
    const userRecordings = this.usersRecodings;
    for (const [key, value] of userRecordings) {
      const isContextUser = key.includes(userId);
      if (!isContextUser) continue;

      const rec = value;
      const isRecordingActive = rec.isRecordingActive;
      if (!isRecordingActive) continue;
      await rec.stopRecording();
    }
  }
}
