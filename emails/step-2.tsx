import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Step2Props {
  firstName?: string;
}

export default function Step2({ firstName = "there" }: Step2Props) {
  return (
    <Html>
      <Head />
      <Preview>Following up</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {firstName},</Text>
          {/* TODO: customize step 2 copy — follow-up / value add */}
          <Text style={text}>
            Just following up on my previous note in case it got buried.
          </Text>
          <Text style={text}>
            Happy to jump on a quick call if that's easier than email.
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
