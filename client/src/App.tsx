import React from "react";
// import { SyncingEditor } from "./SyncingEditor";
import Home from "./Home";
// import HomeContent from "./MyFiles";
// import Courses from "./MyCourses";
import "./Styles/Navigator.css";
import "./Styles/MyCourses.css";
import {Route} from "react-router";
import { BrowserRouter } from 'react-router-dom';

const App = () => {
  return (
      <BrowserRouter>
          <Route exact component={Home}/>
      </BrowserRouter>
  );
};

export default App;
