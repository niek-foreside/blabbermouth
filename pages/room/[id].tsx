import { GlobalContext } from "@/context/global";
import { startRecognition } from "@/recognition/tensor";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import {
  AppBar,
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Draggable from "react-draggable";
import { io } from "socket.io-client";

import useSocket from "../../hooks/useSocket";

type IPeerVideo = {
  id: string | number;
  peerVideoRef: MutableRefObject<any>;
};

const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        "stun:openrelay.metered.ca:80",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
};

let latestDetectedSound = "";

const Room = () => {
  useSocket();
  const router = useRouter();
  const { userName } = useContext(GlobalContext);

  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);

  const userVideoRef = useRef<any>();
  const peerVideoRef = useRef<any>();
  const rtcConnectionRef = useRef<any>(null);
  const socketRef = useRef<any>();

  const userStreamRef = useRef<any>();
  const hostRef = useRef<boolean>(false);

  const peerVideos: IPeerVideo[] = [];

  const { id: roomName } = router.query;

  const handleICECandidateEvent = useCallback(
    (event: { candidate: any }) => {
      if (event.candidate) {
        socketRef.current.emit(
          "ice-candidate",
          event.candidate,
          roomName,
          userName
        );
      }
    },
    [roomName, userName]
  );

  const createPeerConnection = useCallback(() => {
    // We create a RTC Peer Connection
    const connection = new RTCPeerConnection(ICE_SERVERS);

    // We implement our onicecandidate method for when we received a ICE candidate from the STUN server
    connection.onicecandidate = handleICECandidateEvent;

    // We implement our onTrack method for when we receive tracks
    connection.ontrack = handleTrackEvent;
    return connection;
  }, [handleICECandidateEvent]);

  const handleReceivedOffer = useCallback(
    (offer: any) => {
      if (!hostRef.current) {
        rtcConnectionRef.current = createPeerConnection();
        rtcConnectionRef.current.addTrack(
          userStreamRef.current.getTracks()[0],
          userStreamRef.current
        );
        rtcConnectionRef.current.addTrack(
          userStreamRef.current.getTracks()[1],
          userStreamRef.current
        );
        rtcConnectionRef.current.setRemoteDescription(offer);

        rtcConnectionRef.current
          .createAnswer()
          .then((answer: any) => {
            rtcConnectionRef.current.setLocalDescription(answer);
            socketRef.current.emit("answer", answer, roomName);
          })
          .catch((error: any) => {
            console.log(error);
          });
      }
    },
    [createPeerConnection, roomName]
  );

  const handleRoomJoined = useCallback(
    (data: any) => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: { width: 500, height: 500 },
        })
        .then((stream) => {
          /* use the stream */
          userStreamRef.current = stream;
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current.play();
          };
          socketRef.current.emit("ready", roomName);
          startRecognition(userVideoRef, function(data: any){
            socketRef.current.emit("detected_gesture", data, roomName);
          });
        })
        .catch((err) => {
          /* handle the error */
          console.log("error", err);
        });
    },
    [roomName]
  );

  const handleRoomCreated = () => {
    hostRef.current = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        console.log("hier!", stream);
        /* use the stream */
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play();
        };
        startRecognition(userVideoRef, function(data: any){
          socketRef.current.emit("detected_gesture", data, roomName);
        });
      })
      .catch((err) => {
        /* handle the error */
        console.log("Error getting UserMedia - Not allowed");
        console.log(err);
      });
  };

  const initiateCall = useCallback(() => {
    if (hostRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current
      );
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[1],
        userStreamRef.current
      );
      rtcConnectionRef.current
        .createOffer()
        .then((offer: any) => {
          rtcConnectionRef.current.setLocalDescription(offer);
          socketRef.current.emit("offer", offer, roomName);
        })
        .catch((error: any) => {
          console.log(error);
        });
    }
  }, [createPeerConnection, roomName]);

  const onPeerLeave = () => {
    // This person is now the creator because they are the only person in the room.
    hostRef.current = true;
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track: { stop: () => any }) => track.stop()); // Stops receiving all track of Peer.
    }

    // Safely closes the existing connection established with the peer who left.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
  };

  const handleAnswer = (answer: any) => {
    rtcConnectionRef.current
      .setRemoteDescription(answer)
      .catch((err: any) => console.log(err));
  };

  const handlerNewIceCandidateMsg = (
    incoming: RTCIceCandidateInit | undefined
  ) => {
    // We cast the incoming candidate to RTCIceCandidate
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current
      .addIceCandidate(candidate)
      .catch((e: any) => console.log(e));
  };

  const handleTrackEvent = (event: RTCTrackEvent) => {
    peerVideoRef.current.srcObject = event.streams[0];
  };

  const handleGesture = (event: RTCTrackEvent) => {
    console.log('detected gesture', event);
    
    if(latestDetectedSound !== event.detected_hand_gesture){
      if(event.detected_hand_gesture == "thumps_up"){
        const thumps_up = new Audio('../resources/thumps_up.mp3');
        thumps_up.play();
      }
  
      if(event.detected_hand_gesture == "hand_raised"){
        const hand_raised = new Audio('../resources/hand_raised.mp3');
        hand_raised.play();
      }

      if(event.detected_hand_gesture == "german"){
        const german = new Audio('../resources/german.mp3');
        german.play();
      }

      if(event.detected_hand_gesture == "thump_down"){
        const thump_down = new Audio('../resources/thump_down.mp3');
        thump_down.play();
      }
    }    

    latestDetectedSound = event.detected_hand_gesture;

  };

  const toggleMediaStream = (type: string, state: boolean) => {
    userStreamRef.current
      .getTracks()
      .forEach((track: { kind: any; enabled: boolean }) => {
        if (track.kind === type) {
          // eslint-disable-next-line no-param-reassign
          track.enabled = !state;
        }
      });
  };

  const toggleMic = () => {
    toggleMediaStream("audio", micActive);
    setMicActive((prev) => !prev);
  };

  const toggleCamera = () => {
    console.log("toggleCamera called", cameraActive);

    toggleMediaStream("video", cameraActive);
    setCameraActive((prev) => !prev);
  };

  const leaveRoom = () => {
    console.log("leaveRoom called");

    socketRef.current.emit("leave", roomName); // Let's the server know that user has left the room.

    if (userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject
        .getTracks()
        .forEach((track: { stop: () => any }) => track.stop()); // Stops receiving all track of User.
    }
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track: { stop: () => any }) => track.stop()); // Stops receiving audio track of Peer.
    }

    // Checks if there is peer on the other side and safely closes the existing connection established with the peer.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
    router.push("/");
  };

  useEffect(() => {
    socketRef.current = io();
    // First we join a room and wait for socket to connect
    setTimeout(() => {
      // Check if we have a Username
      !userName && router.push("/");
      socketRef.current.emit("join", {
        roomName: roomName,
        socketId: socketRef.current.id,
        name: userName,
      });
    }, 100);

    socketRef.current.on("joined", handleRoomJoined);
    // If the room didn't exist, the server would emit the room was 'created'
    socketRef.current.on("created", handleRoomCreated);
    // Whenever the next person joins, the server emits 'ready'
    socketRef.current.on("ready", initiateCall);

    // Emitted when a peer leaves the room
    socketRef.current.on("leave", onPeerLeave);

    // If the room is full, we show an alert
    socketRef.current.on("full", () => {
      window.location.href = "/";
    });

    // Event called when a remote user initiating the connection and
    socketRef.current.on("offer", handleReceivedOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);
    socketRef.current.on("detected_gesture", handleGesture)

    // clear up after
    return () => socketRef.current.disconnect();
  }, [
    handleReceivedOffer,
    handleRoomJoined,
    initiateCall,
    roomName,
    router,
    userName,
  ]);

  return (
    <>
      <Head>
        <title>Channel | {roomName} </title>
      </Head>
      <AppBar position="static">
        <Toolbar>
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
              onClick={leaveRoom}
            >
              <Typography sx={{ mr: 2 }}>Leave room</Typography>
              <ExitToAppIcon />
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
      <Container>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <video autoPlay ref={peerVideoRef} width="100%" height="100%" />
          </Grid>
        </Grid>

        {/* User own feed */}
        <Draggable>
          <Box
            sx={{
              position: "fixed",
              bottom: 10,
              right: 10,
              padding: 1,
              background: grey[100],
            }}
          >
            <Box sx={{ width: "20vw", height: "20vw" }}>
              <video autoPlay ref={userVideoRef} width="100%" height="100%" />
            </Box>
            <Box
              sx={{
                position: "absolute",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "20vw",
                lineHeight: "30px",
                height: "32px",
                marginTop: "-32px",
                background: "white",
                opacity: 0.5,
              }}
            >
              <Typography align="center">{userName}</Typography>
            </Box>
            <Box
              sx={{ display: "flex", my: 2, justifyContent: "space-evenly" }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={toggleCamera}
              >
                {cameraActive && <VideocamIcon />}
                {!cameraActive && <VideocamOffIcon sx={{ color: "#F00" }} />}

                <Typography variant="subtitle2">
                  {cameraActive ? "Turn off" : "Turn on"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={toggleMic}
              >
                {micActive && <MicIcon />}
                {!micActive && <MicOffIcon sx={{ color: "#F00" }} />}
                <Typography variant="subtitle2">
                  {micActive ? "Mute" : "Unmute"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Draggable>
      </Container>
    </>
  );
};

export default Room;
