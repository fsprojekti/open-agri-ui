import './App.css'

import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Parcel from "./pages/parcel/Parcel.jsx";


import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import DbProvider from "./contexts/DbProvider.jsx";
import Farm from "./pages/farm/Farm.jsx";
import FarmQuickPick from "./pages/farm/FarmQuickPick.jsx";
import FarmFilter from "./pages/farm/FarmFilter.jsx";

import RegistrationWizard from "./pages/register/registrationWizard.jsx";
import ParcelAddWizard from "./pages/parcel/ParcelAddWizard.jsx";
import CropAddWizard from "./pages/crop/CropAddWizzard.jsx";
import Crop from "./pages/crop/Crop.jsx";
import Apiary from "./pages/apiary/Apiary.jsx";
import Beehive from "./pages/beehive/Beehive.jsx";
import ApiaryAddWizard from "./pages/apiary/ApiaryAddWizard.jsx";
import BeehiveAddWizard from "./pages/beehive/BeehiveAddWizzard.jsx";
import ParcelSearchWizard from "./pages/parcel/ParcelSearchWizard.jsx";
import CropSearchWizard from "./pages/crop/CropSearchWizzad.jsx";
import ApiarySearchWizard from "./pages/apiary/ApiarySearchWizzard.jsx";
import BeehiveSearchWizard from "./pages/beehive/BeehiveSearchWizzard.jsx";
import CropManageWizard from "./pages/crop/CropManageWizard.jsx";
import CropObserveWizard from "./pages/crop/CropObserveWizzard.jsx";



function App() {

  return (
      <DbProvider>
      <BrowserRouter>
          <Routes>
              {/* default redirect */}
              <Route path="/" element={<Navigate to="/home" replace/>}/>

              {/* Public pages that anyone can see */}
              <Route path="/home" element={<Home/>}/>

              {/* Public-only pages (hide from logged-in users) */}
              <Route element={<PublicOnlyRoute/>}>
                    <Route path="/login" element={<Login/>}/>
                  <Route path="/register/*" element={<RegistrationWizard />} />
              </Route>

              {/* Protected pages (require JWT) */}
              <Route element={<ProtectedRoute/>}>
                  <Route path="/dashboard" element={<Dashboard/>}/>
                  <Route path="/parcels" element={<Parcel/>}/>
                  <Route path="/parcels/add/*" element={<ParcelAddWizard />} />
                  <Route path="/parcels/search/*" element={<ParcelSearchWizard />} />
                  {/* add more protected routes here, e.g.: */}
                  {/* <Route path="/plots" element={<Plots />} />*/}

                  <Route path="/crops" element={<Crop />} />
                  <Route path="/crops/add/*" element={<CropAddWizard />} />
                  <Route path="/crops/search/*" element={<CropSearchWizard />} />
                  <Route path="/crops/observe/*" element={<CropObserveWizard />} />
                  <Route path="/crops/manage/*" element={<CropManageWizard />} />

                  {/*<Route path="/pests" element={<Pests />} />*/}
                  <Route path="/apiary" element={<Apiary />} />
                  <Route path="/apiary/add/*" element={<ApiaryAddWizard />} />
                  <Route path="/apiary/search/*" element={<ApiarySearchWizard />} />

                  <Route path="/beehive" element={<Beehive />} />
                  <Route path="/beehive/add/*" element={<BeehiveAddWizard />} />
                  <Route path="/beehive/search/*" element={<BeehiveSearchWizard />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/home" replace/>}/>
          </Routes>
      </BrowserRouter>
      </DbProvider>
  )
}

export default App
