import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import MockTests from "./pages/MockTests";
import Listening from "./pages/Listening";
import Reading from "./pages/Reading";
import Writing from "./pages/Writing";
import Speaking from "./pages/Speaking";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Exam from "./pages/Exam";

function Private({children}) {
 return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App(){
 return <AppProvider><Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="/dashboard" element={<Private><Dashboard/></Private>}/>
  <Route path="/practice" element={<Private><Practice/></Private>}/>
  <Route path="/mock-tests" element={<Private><MockTests/></Private>}/>
  <Route path="/listening" element={<Private><Listening/></Private>}/>
  <Route path="/reading" element={<Private><Reading/></Private>}/>
  <Route path="/writing" element={<Private><Writing/></Private>}/>
  <Route path="/speaking" element={<Private><Speaking/></Private>}/>
  <Route path="/progress" element={<Private><Progress/></Private>}/>
  <Route path="/profile" element={<Private><Profile/></Private>}/>
  <Route path="/exam/:testId" element={<Private><Exam/></Private>}/>
  <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
 </Routes></AppProvider>
}
