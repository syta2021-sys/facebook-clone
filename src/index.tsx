import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/css/index.css';
import Login from '@/pages/login';
import { BrowserRouter, Route, Routes } from 'react-router';
import paths from '@/router/paths';
import Verify from '@/pages/verify';
import Index from '@/pages';
const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route path={`${paths.index}`} element={<Index />} />,
                    <Route path={`${paths.login}`} element={<Login />} />,
                    <Route path={`${paths.verify}`} element={<Verify />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
}
