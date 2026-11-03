import { createBrowserRouter, createRoutesFromElements } from 'react-router';
import { m01Routes } from '../modules/m01/routes';
import { m02Routes } from '../modules/m02/routes';
import { m03Routes } from '../modules/m03/routes';

// React Router data mode (tech-stack §3): cần cho `useBlocker` và `errorElement`.
// Mỗi module tự đăng ký cây route JSX của mình vào đây ở task routes riêng (M01 T032, M02 T024, M03 T046).
export function createAppRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <>
        {m01Routes}
        {m02Routes}
        {m03Routes}
      </>,
    ),
  );
}
