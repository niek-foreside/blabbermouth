import { Box, Button, Container, Typography } from "@mui/material";

import { GlobalContext } from "@/context/global";
import useSocket from "@/hooks/useSocket";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";

export default function Home() {
  const router = useRouter();
  useSocket();
  const [roomName, setRoomName] = useState("");

  const { userName, setUserName } = useContext(GlobalContext);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const onSubmit = (data: any) => {
    setUserName(data.name);
    router.push(`/room/${slugify("generic")}`);
  };

  return (
    <>
      <Head>
        <title>Foreside Blabbermouth</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="xl">
        <Typography variant="h1" align="center">
          Join Room
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "30vw",
                mt: 8,
                input: { my: 2, height: "30px", py: 2 },
              }}
            >
              <label htmlFor="name">Your name</label>
              <input
                {...register("name", { required: true })}
                id="name"
                type="text"
                placeholder="Your name"
              />

              {errors.name && (
                <Typography color="error">Your name is required</Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                sx={{ my: 2 }}
              >
                Join room
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </>
  );
}
