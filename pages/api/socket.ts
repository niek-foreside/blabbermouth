import { Server } from "socket.io";

type IUser = {
  id: string;
  name: string;
  socketId: string;
};

type IConferenceRoom = {
  id: string;
  name: string;
  slug: string;
  users: IUser["id"][];
};

const users: IUser[] = [];
const conferenceRooms: IConferenceRoom[] = [];

const SocketHandler = (req: any, res: any) => {
  if (res.socket.server.io) {
    // Socket already attached
    return res.end();
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log(`User Connected :${socket.id}`);
    const userExists = users.find((user) => user.socketId === socket.id);

    // Triggered when a peer hits the join room button.
    socket.on("join", ({ roomName, socketId, name }) => {
      const { rooms } = io.sockets.adapter;
      const room = rooms.get(roomName);

      // room == undefined when no such room exists.
      if (!room) {
        socket.join(roomName);
        socket.emit("created");
      } else if (room.size >= 1) {
        // room.size == 1 when one person is inside the room.
        socket.join(roomName);
        socket.emit("joined", { name, socketId });
      } else {
        // when there are already two people inside the room.
        socket.emit("full");
      }
    });

    // Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", (roomName) => {
      socket.broadcast.to(roomName).emit("ready"); // Informs the other peer in the room.
    });

    // Triggered when server gets an icecandidate from a peer in the room.
    socket.on(
      "ice-candidate",
      (candidate: RTCIceCandidate, roomName: string, username: string) => {
        socket.broadcast.to(roomName).emit("ice-candidate", candidate); // Sends Candidate to the other peer in the room.
      }
    );

    // Triggered when server gets an offer from a peer in the room.
    socket.on("offer", (offer, roomName) => {
      socket.broadcast.to(roomName).emit("offer", offer); // Sends Offer to the other peer in the room.
    });

    // Triggered when server gets an answer from a peer in the room.
    socket.on("answer", (answer, roomName) => {
      socket.broadcast.to(roomName).emit("answer", answer); // Sends Answer to the other peer in the room.
    });

    socket.on("leave", (roomName) => {
      socket.leave(roomName);
      socket.broadcast.to(roomName).emit("leave");
    });
  });
  return res.end();
};

export default SocketHandler;
