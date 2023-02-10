import React, { useState } from "react";

interface IGlobalContextProps {
  userName: string;
  setUserName: (name: string) => void;
  socketId: string;
  setSocketId: (socketId: string) => void;
}

export const GlobalContext = React.createContext<IGlobalContextProps>({
  userName: "",
  setUserName: () => {},
  socketId: "",
  setSocketId: () => {},
});

export const GlobalContextProvider = (props: any) => {
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentSocketId, setCurrentSocketId] = useState("");

  return (
    <GlobalContext.Provider
      value={{
        userName: currentUserName,
        setUserName: setCurrentUserName,
        socketId: currentSocketId,
        setSocketId: setCurrentSocketId,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
};
