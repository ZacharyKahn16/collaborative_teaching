import React, { useContext } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Home from "./Home";
import LoginPage from "./LoginPage";
import { UserContext } from "./UserContext";
import "./Styles/App.css";
import "./Styles/Navigator.css";
import "./Styles/MyCourses.css";
import Courses from "./MyCourses";

class App extends React.Component {
  static contextType = UserContext;

  render() {
    const { user } = this.context;

    if (!user) {
      return <LoginPage />;
    }

    return (
      <BrowserRouter>
        <Route exact component={Home} />
      </BrowserRouter>
    );
  }
}
export default App;
