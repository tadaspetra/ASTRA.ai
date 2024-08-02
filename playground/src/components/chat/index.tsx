"use client";

import {
  genRandomChatList,
  useAppSelector,
  useAutoScroll,
  useSmallScreen,
} from "@/common";
import { useRef, useState } from "react";
import ChatItem from "./chatItem";
import styles from "./index.module.scss";

const MOCK_CHAT_LIST = genRandomChatList(10);

const Chat = () => {
  const chatItems = useAppSelector((state) => state.global.chatItems);
  // const chatItems = MOCK_CHAT_LIST
  const [message, setMessage] = useState("");
  const chatRef = useRef(null);
  const { isSmallScreen } = useSmallScreen();
  useAutoScroll(chatRef);

  const onSendMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <section className={styles.chat}>
      <div
        className={`${styles.content} ${isSmallScreen ? styles.small : ""}`}
        ref={chatRef}
      >
        {chatItems.map((item, index) => {
          return <ChatItem data={item} key={index}></ChatItem>;
        })}
      </div>
    </section>
  );
};

export default Chat;
