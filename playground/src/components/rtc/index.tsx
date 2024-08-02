"use client";

import {
  apiPing,
  apiStartService,
  apiStopService,
  useAppDispatch,
  useAppSelector,
} from "@/common";
import { IRtcUser, IUserTracks, rtcManager } from "@/manager";
import {
  addChatItem,
  setAgentConnected,
  setRoomConnected,
} from "@/store/reducers/global";
import { ITextItem } from "@/types";
import LoadingOutlined from "@ant-design/icons/lib/icons/LoadingOutlined";
import { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { message } from "antd";
import { useEffect, useState } from "react";
import Agent from "./agent";
import styles from "./index.module.scss";
import MicSection from "./micSection";

let hasInit = false;
let intervalId: any;

const Rtc = () => {
  const dispatch = useAppDispatch();
  const options = useAppSelector((state) => state.global.options);
  const { userId, channel } = options;
  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack>();
  const [remoteuser, setRemoteUser] = useState<IRtcUser>();
  const agentConnected = useAppSelector((state) => state.global.agentConnected);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      checkAgentConnected();
    }
  }, [channel]);

  const checkAgentConnected = async () => {
    const res: any = await apiPing(channel);
    if (res?.code == 0) {
      dispatch(setAgentConnected(true));
    }
  };

  const onClickConnect = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    if (agentConnected) {
      await apiStopService(channel);
      dispatch(setAgentConnected(false));
      message.success("Agent disconnected");
      stopPing();
    } else {
      const res = await apiStartService({
        channel,
        userId,
        language: "en-US",
        voiceType: "male",
      });
      const { code, msg } = res || {};
      if (code != 0) {
        if (code == "10001") {
          message.error(
            "The number of users experiencing the program simultaneously has exceeded the limit. Please try again later."
          );
        } else {
          message.error(`code:${code},msg:${msg}`);
        }
        setLoading(false);
        throw new Error(msg);
      }
      dispatch(setAgentConnected(true));
      message.success("Agent connected");
      startPing();
    }
    setLoading(false);
  };

  const startPing = () => {
    if (intervalId) {
      stopPing();
    }
    intervalId = setInterval(() => {
      apiPing(channel);
    }, 3000);
  };

  const stopPing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  useEffect(() => {
    if (!options.channel) {
      return;
    }
    if (hasInit) {
      return;
    }

    init();

    return () => {
      if (hasInit) {
        destory();
      }
    };
  }, [options.channel]);

  const init = async () => {
    console.log("[test] init");
    rtcManager.on("localTracksChanged", onLocalTracksChanged);
    rtcManager.on("textChanged", onTextChanged);
    rtcManager.on("remoteUserChanged", onRemoteUserChanged);
    await rtcManager.createTracks();
    await rtcManager.join({
      channel,
      userId,
    });
    await rtcManager.publish();
    dispatch(setRoomConnected(true));
    hasInit = true;
  };

  const destory = async () => {
    console.log("[test] destory");
    rtcManager.off("textChanged", onTextChanged);
    rtcManager.off("localTracksChanged", onLocalTracksChanged);
    rtcManager.off("remoteUserChanged", onRemoteUserChanged);
    await rtcManager.destroy();
    dispatch(setRoomConnected(false));
    hasInit = false;
  };

  const onRemoteUserChanged = (user: IRtcUser) => {
    console.log("[test] onRemoteUserChanged", user);
    setRemoteUser(user);
  };

  const onLocalTracksChanged = (tracks: IUserTracks) => {
    console.log("[test] onLocalTracksChanged", tracks);
    const { audioTrack } = tracks;
    if (audioTrack) {
      setAudioTrack(audioTrack);
    }
  };

  const onTextChanged = (text: ITextItem) => {
    if (text.dataType == "transcribe") {
      const isAgent = Number(text.uid) != Number(userId);
      dispatch(
        addChatItem({
          userId: text.uid,
          text: text.text,
          type: isAgent ? "agent" : "user",
          isFinal: text.isFinal,
          time: text.time,
        })
      );
    }
  };

  return (
    <section className={styles.rtc}>
      <div className={styles.header}>Audio & Video</div>
      {/* agent */}
      <Agent audioTrack={remoteuser?.audioTrack}></Agent>
      {/* you */}
      <div className={styles.you}>
        <div className={styles.title}>You</div>
        {/* microphone */}
        <MicSection audioTrack={audioTrack}></MicSection>
        {/* camera */}
      </div>
      {/* connect */}
      <div
        className={`${styles.btnConnect} ${
          agentConnected ? styles.disconnect : ""
        }`}
        onClick={onClickConnect}
      >
        <span
          className={`${styles.btnText} ${
            agentConnected ? styles.disconnect : ""
          }`}
        >
          {!agentConnected ? "Connect" : "Disconnect"}
          {loading ? (
            <LoadingOutlined className={styles.loading}></LoadingOutlined>
          ) : null}
        </span>
      </div>
    </section>
  );
};

export default Rtc;
