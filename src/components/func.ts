import { Message, MessageReactions, Room } from "vue-advanced-chat";

type CreateConnectionResult = {
  connection: RTCPeerConnection;
  answerSdp: string;
};

export const createConnection = async (userName: string, userSdp: string): Promise<CreateConnectionResult> => {
  const connection = new RTCPeerConnection();

  const remoteDescription = new RTCSessionDescription({ sdp: userSdp, type: 'offer' });

  await connection.setRemoteDescription(remoteDescription);

  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);

  const answerSdp = answer.sdp!;

  return {
    connection,
    answerSdp,
  };
};

export const formatRoom = (userName: string, currentUserName: string): Room => ({
  roomId: userName,
  roomName: userName,
  users: [
    {
      _id: userName,
      avatar: '',
      username: userName,
      status: {
        state: 'online',
        lastChanged: new Date().toLocaleDateString(),
      },
    },
    {
      _id: currentUserName,
      avatar: '',
      username: currentUserName,
      status: {
        state: 'online',
        lastChanged: new Date().toLocaleDateString(),
      },
    },
  ],
});

export const formatMessage = (id: number, content: string, senderId: string): Message => ({
  _id: id.toString(),
  content,
  senderId,
  username: senderId,
  date: new Date().toLocaleDateString(),
  timestamp: new Date().toTimeString().split(' ')[0],
  saved: true,
  disableActions: true,
  disableReactions: true,
  reactions: {} as MessageReactions,
});
