import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Step3Props {
  firstName?: string;
}

export default function Step3({ firstName = "there" }: Step3Props) {
  return (
    <Html>
      <Head />
      <Preview>Last note</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {firstName},</Text>
          {/* TODO: customize step 3 copy — final touch / closing */}
          <Text style={text}>
            I'll leave it here for now — just wanted to make sure my earlier
            notes didn't get lost.
          </Text>
          <Text style={text}>
            Feel free to reach out any time. The door's always open.
          </Text>
          <Text style={text}>
            Best,
            <br />
            [YOUR NAME]
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "24px 16px",
};

const text: React.CSSProperties = {
  color: "#111111",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};
