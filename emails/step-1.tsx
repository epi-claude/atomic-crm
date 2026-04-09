import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Step1Props {
  firstName?: string;
}

export default function Step1({ firstName = "there" }: Step1Props) {
  return (
    <Html>
      <Head />
      <Preview>Quick intro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {firstName},</Text>
          {/* TODO: customize step 1 copy — first touch / introduction */}
          <Text style={text}>
            I wanted to reach out and introduce myself briefly.
          </Text>
          <Text style={text}>
            Would love to connect if the timing is right — happy to keep it
            short.
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
