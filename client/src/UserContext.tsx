import React, { createContext, useEffect, useState } from "react";
import { AUTH } from "./Firebase";

export const UserContext = createContext<any>(null);

const UserContextProvider = (props: any) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AUTH.onAuthStateChanged(user => {
      if (user) {
        setUser({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        })
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <UserContext.Provider value={{user}}>{props.children}</UserContext.Provider>
  );
};

export default UserContextProvider;
