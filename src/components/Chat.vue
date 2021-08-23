<template>
  <div>Chat</div>
  <chat-window
    class="chat"
    :current-user-id="currentUserName"
    :rooms="rooms"
    :messages="messages[roomId]"
    :rooms-loaded="true"
    :messages-loaded="messagesLoaded"
    :show-add-room="false"
    :show-files="false"
    :show-audio="false"
    :theme="'dark'"
    @send-message="handleSendMessageToUser"
    @fetch-messages="fetchMessages"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MessageType } from '@/constants/message';
import { SIGNALLING_SERVER_URL } from '@/constants/api';
import ChatWindow, { Messages, Rooms } from 'vue-advanced-chat';
import 'vue-advanced-chat/dist/vue-advanced-chat.css';
import { createConnection, formatMessage, formatRoom } from '@/components/func';

type UserInfo = {
  connection?: RTCPeerConnection;
  channel?: RTCDataChannel;
};

export default defineComponent({
  name: 'Chat',
  components: {
    ChatWindow,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      serverConnection: undefined as WebSocket | undefined,
      users: {} as Record<string, UserInfo>,
      rooms: [] as Rooms,
      messages: {} as Record<string, Messages>,
      roomId: '',
      messagesLoaded: true,
      currentUserName: 'admin',
      messageIncrement: 0,
    };
  },
  async mounted() {
    const serverConnection = new WebSocket(SIGNALLING_SERVER_URL);
    serverConnection.onopen = async () => {
      const loginData = {
        type: MessageType.Login,
        adminCredentials: {
          userName: this.currentUserName,
          password: 'admin',
        },
      };
      serverConnection.send(JSON.stringify(loginData));
      serverConnection.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case MessageType.Offer: {
            const { userName, sdp } = data;
            const connection = await this.createConnection(userName, sdp);
            this.addUser(connection, userName);
            break;
          }
          case MessageType.IceCandidate: {
            const { candidate, fromUserName } = data;
            this.users[fromUserName]?.connection?.addIceCandidate(JSON.parse(candidate));
            break;
          }
        }
      };
    };
    this.serverConnection = serverConnection;
  },
  methods: {
    handleSendMessageToUser({ content, roomId }: { content: string; roomId: string }) {
      this.users[roomId]?.channel?.send(content);
      this.addMessage(content, this.currentUserName, roomId);
    },

    addUser(connection: RTCPeerConnection, userName: string) {
      this.users = {
        ...this.users,
        [userName]: {
          connection,
        },
      };
      this.createRoom(userName);
      if (!this.roomId) {
        this.roomId = userName;
      }
    },
    createRoom(userName: string) {
      this.rooms = [...this.rooms, formatRoom(userName, this.currentUserName)];
    },
    addMessage(message: string, userName: string, remoteUserName: string) {
      this.messages = {
        ...this.messages,
        [remoteUserName]: [
          ...(this.messages?.[remoteUserName] || []),
          formatMessage(this.messageIncrement, message, userName),
        ],
      };
      this.messageIncrement++;
    },
    fetchMessages({ room: { roomId } }: { room: { roomId: string } }) {
      this.messagesLoaded = false;
      this.roomId = roomId;
      setTimeout(() => {
        this.messagesLoaded = true;
      }, 0);
    },

    async createConnection(userName: string, userSdp: string): Promise<RTCPeerConnection> {
      const { connection, answerSdp } = await createConnection(userName, userSdp);

      this.attachConnectionHandlers(connection, userName);
      this.sendAnswer(answerSdp, userName);

      return connection;
    },
    attachConnectionHandlers(connection: RTCPeerConnection, userName: string) {
      connection.ondatachannel = (event) => {
        this.users[userName].channel = event.channel;
        event.channel.onmessage = (incomingMessage) => {
          this.addMessage(incomingMessage.data, userName, userName);
        };
      };
      connection.oniceconnectionstatechange = () => {
        const deleteUserRef = setTimeout(() => {
          delete this.users[userName];
          delete this.messages[userName];
          this.rooms = this.rooms.filter(({ roomId }) => roomId !== userName);
          if (this.roomId === userName) {
            this.roomId = (this?.rooms[0]?.roomId as string) || '';
          }
        }, 5000);
        if (!['failed', 'closed', 'disconnected'].includes(connection.iceConnectionState)) {
          clearTimeout(deleteUserRef);
        }
      };
      connection.onicecandidate = (event) => {
        const iceCandidateMessage = {
          type: MessageType.IceCandidate,
          candidate: JSON.stringify(event.candidate),
          forUserName: userName,
        };
        this.serverConnection?.send(JSON.stringify(iceCandidateMessage));
      };
    },
    sendAnswer(answerSdp: string, userName: string) {
      const answerMessage = {
        type: MessageType.Answer,
        sdp: answerSdp,
        forUserName: userName,
      };
      this.serverConnection?.send(JSON.stringify(answerMessage));
    },
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.chat {
  flex: 1 1 auto;
}
</style>
