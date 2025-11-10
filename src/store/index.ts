import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import { baseApi } from "@/services/base-api";
import { authListenerMiddleware } from "./listeners";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(
        baseApi.middleware,
        authListenerMiddleware.middleware,
      ),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<AppStore["getState"]>;
