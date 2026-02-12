import styled from "@emotion/styled";
import { useEffect, useMemo, useState } from "react";
import Orb from "./components/Orb";
import IconCopy from "./assets/iconCopy.svg?react";
import CountUp from "./components/CountUp";
import TerminalAnimation from "./components/TerminalAnimation";
import LogoMarquee, { type MarqueeLogo } from "./components/LogoMarquee";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import distrokid from "./assets/partners/distrokid.png";
import ddex from "./assets/partners/ddex.png";
import downtown from "./assets/partners/downtown.png";
import empire from "./assets/partners/empire.png";
import fuga from "./assets/partners/fuga.png";
import kobalt from "./assets/partners/kobalt.png";
import labelworx from "./assets/partners/labelworx.png";
import nettwerk from "./assets/partners/nettwerk.png";
import warner from "./assets/partners/warner.png";
import blockdaemon from "./assets/partners/blockdaemon.png";
import cultur3 from "./assets/partners/cultur3.png";
import figment from "./assets/partners/figment.png";
import kraken from "./assets/partners/kraken.png";
import hivemind from "./assets/partners/hivemind.png";

const marqueeLogos: MarqueeLogo[] = [
  { src: distrokid, alt: "DistroKid", width: 106.5 },
  { src: warner, alt: "Warner", width: 93.79 },
  { src: kobalt, alt: "Kobalt", width: 88.91 },
  { src: ddex, alt: "DDEX", width: 110.56 },
  { src: downtown, alt: "Downtown", width: 120.93 },
  { src: empire, alt: "Empire", width: 44.05 },
  { src: fuga, alt: "Fuga", width: 110.39 },
  { src: nettwerk, alt: "Nettwerk", width: 50.58 },
  { src: labelworx, alt: "LabelWorx", width: 187.3 },
  { src: blockdaemon, alt: "Blockdaemon", width: 142.21 },
  { src: cultur3, alt: "Cultur3", width: 18.64 },
  { src: figment, alt: "Figment", width: 105.13 },
  { src: kraken, alt: "Kraken", width: 60.44 },
  { src: hivemind, alt: "Hivemind", width: 149.56 },
];

const AudiusLink = styled.a`
  color: currentColor;
  text-decoration: none;
  transition: color 250ms cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    color: #d767e1;
  }
`;

const BlendWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 9;
  color: #ffffff;
  mix-blend-mode: difference;
  pointer-events: none;
  a,
  button {
    pointer-events: auto;
  }
`;

const HeroTextWrap = styled.div`
  position: absolute;
  left: 48px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  @media (max-width: 768px) {
    left: 16px;
    right: 16px;
    top: 24%;
    transform: translateY(-24%);
    gap: 14px;
    @media (max-height: 740px) {
      padding-top: 24px;
    }
    @media (max-height: 640px) {
      padding-top: 36px;
    }
  }
`;

const LineSmall = styled.div`
  user-select: none;
  font-family: "new-science", sans-serif;
  font-size: 20px;
  letter-spacing: 0.03em;
  opacity: 0.85;
  pointer-events: none;
  a {
    pointer-events: auto;
  }
`;

const LineBig = styled.h1`
  user-select: none;
  margin: 0;
  font-family: "new-science", sans-serif;
  font-size: clamp(40px, 8vw, 400px);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  pointer-events: none;
  @media (max-width: 768px) {
    line-height: 1.08;
  }
`;

const AgentPromptText = `Read https://openaudio.org/agents.md and follow the instructions to build on the Open Audio Protocol.`;

const VibecodeButton = styled.a`
  margin-top: 12px;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 18px;
  border: 1px solid currentColor;
  border-radius: 9999px;
  color: currentColor;
  text-decoration: none;
  font-family: "new-science", sans-serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  opacity: 1;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
  &:active {
    color: #000000;
    background: #d767e1;
    border-color: #d767e1;
  }
`;

const VibecodeSection = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  scroll-margin-top: 120px;
`;

const VibecodeContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 96px 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  @media (max-width: 768px) {
    padding: 64px 16px;
    gap: 20px;
  }
`;

const VibecodeHeading = styled.h2`
  margin: 0;
  font-family: "new-science", sans-serif;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
`;

const VibecodeSubheading = styled.p`
  margin: 0;
  font-family: "new-science", sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.02em;
  opacity: 0.75;
  line-height: 1.4;
`;

const VibecodeCodeWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  padding: 20px 48px 20px 24px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  color: #000000;
  background: rgba(0, 0, 0, 0.04);
  pointer-events: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
`;

const AgentPromptCode = styled.span`
  user-select: all;
  display: block;
  font-family: "new-science", ui-monospace, monospace;
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: center;
`;

const CopyToast = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #000000;
  color: #ffffff;
  font-family: "new-science", sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 100;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  transition:
    opacity 200ms ease,
    visibility 200ms ease;
`;

const CopyIconButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px;
  border: none;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 200ms ease;
  display: flex;
  user-select: none;
  &:hover {
    opacity: 1;
  }
  svg {
    display: block;
  }
`;

// Below-the-fold layout
const BelowFold = styled.main`
  position: relative;
  background: #ffffff;
  color: #000000;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 96px 48px;
  @media (max-width: 768px) {
    padding: 64px 16px;
  }
`;

const StatsSection = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: start;
  justify-items: start;
  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatNumber = styled.div`
  font-family: "new-science", sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 12vw, 128px);
  line-height: 1.12;
`;

const StatLabel = styled.div`
  font-family: "new-science", sans-serif;
  font-size: 24px;
`;

const FeaturesSection = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 64px;
`;

const PartnersSection = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const PartnersHeading = styled.div`
  font-family: "new-science", sans-serif;
  font-size: 24px;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const AboutSection = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const AboutText = styled.div`
  max-width: 680px;
  font-family: "new-science", sans-serif;
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.9;
  p {
    margin: 0 0 16px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

// Deprecated row styling replaced by LogoMarquee

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  border-radius: 4px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  &:hover {
    border-color: #000;
    opacity: 0.8;
  }
`;

const FeatureImage = styled.div`
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  background: #ffffff;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    display: block;
  }
`;

const FeatureBadge = styled.div`
  font-family: "new-science", sans-serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.7;
`;

const FeatureTitle = styled.h3`
  margin: 0;
  font-family: "new-science", sans-serif;
  font-weight: 800;
  font-size: 22px;
  line-height: 1.2;
`;

const FeatureDesc = styled.p`
  margin: 0;
  font-family: "new-science", sans-serif;
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.85;
`;

const ResponsiveOrb = styled(Orb)`
  height: 100vh;
  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

const HeroTicker = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9;
  mix-blend-mode: difference;
  color: #ffffff;
  pointer-events: none;
  width: 100vw;
  font-size: 18px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;
const FullWidthTerminal = styled(TerminalAnimation)`
  width: 100vw;
  display: block;
  background: transparent;
  color: #ffffff;
`;

function App() {
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [totalStreams, setTotalStreams] = useState<number | null>(null);
  const [totalWallets, setTotalWallets] = useState<number | null>(null);
  const [totalArtists, setTotalArtists] = useState<number | null>(null);
  const [appVisible, setAppVisible] = useState<boolean>(false);
  const appFadeClass = useMemo(
    () => (appVisible ? "app-visible" : "app-hidden"),
    [appVisible],
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let intervalId: number | null = null;
    const fetchMetric = async (url: string): Promise<number | null> => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;
        const json = await res.json();
        const v = json?.data?.total;
        return typeof v === "number" ? v : null;
      } catch {
        return null;
      }
    };
    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const [plays, wallets, artists] = await Promise.all([
          fetchMetric("https://api.audius.co/v1/metrics/total_plays"),
          fetchMetric("https://api.audius.co/v1/metrics/total_wallets"),
          fetchMetric("https://api.audius.co/v1/metrics/total_artists"),
        ]);
        if (cancelled) return;
        if (plays != null) setTotalStreams(plays);
        if (wallets != null) setTotalWallets(wallets);
        if (artists != null) setTotalArtists(artists);
      } finally {
        inFlight = false;
      }
    };
    run();
    intervalId = window.setInterval(run, 5000);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={appFadeClass}>
      <CopyToast $visible={copyToastVisible}>Copied!</CopyToast>
      <SiteHeader />
      <BlendWrap>
        <HeroTextWrap>
          <div>
            <LineSmall>The OPEN AUDIO PROTOCOL is</LineSmall>
            <LineBig>
              The Global <br />
              Music Database
            </LineBig>
            <LineSmall>
              Powering{" "}
              <AudiusLink
                href="https://audius.co"
                target="_blank"
                rel="noreferrer"
              >
                Audius
              </AudiusLink>{" "}
              and those who reject the streaming status quo
            </LineSmall>
          </div>
          <VibecodeButton href="#vibecode">
            &lt; Start Vibecoding /&gt;
          </VibecodeButton>
        </HeroTextWrap>
      </BlendWrap>
      <ResponsiveOrb onReady={() => setAppVisible(true)} />
      <BelowFold>
        <PartnersSection>
          <Container>
            <PartnersHeading>WITH PARTNERS</PartnersHeading>
            <LogoMarquee logos={marqueeLogos} />
          </Container>
        </PartnersSection>
        <VibecodeSection id="vibecode">
          <VibecodeContainer>
            <VibecodeHeading>Vibecode Ready</VibecodeHeading>
            <VibecodeSubheading>
              Copy and paste this box and send it to your AI Agent
            </VibecodeSubheading>
            <VibecodeCodeWrap>
              <AgentPromptCode>{AgentPromptText}</AgentPromptCode>
              <CopyIconButton
                type="button"
                aria-label="Copy"
                onClick={async () => {
                  await navigator.clipboard.writeText(AgentPromptText);
                  setCopyToastVisible(true);
                  setTimeout(() => setCopyToastVisible(false), 2000);
                }}
              >
                <IconCopy />
              </CopyIconButton>
            </VibecodeCodeWrap>
          </VibecodeContainer>
        </VibecodeSection>
        <AboutSection>
          <Container>
            <AboutText>
              <p>
                The Open Audio Protocol is the Global Music Database: the
                largest open, programmable music catalog in existence. It
                enables storage, streaming, programmable sale, and access
                control for your works.
              </p>
              <p>
                Developers can build anything on top of it. Bring your own UI,
                your own product ideas, and your own business model without
                worrying about sourcing catalog data or rebuilding core music
                infrastructure.
              </p>
            </AboutText>
          </Container>
        </AboutSection>
        <StatsSection>
          <Container>
            <StatsGrid>
              <StatCard>
                <StatNumber>
                  <CountUp to={totalStreams} initialValue={0} delayMs={50} />
                </StatNumber>
                <StatLabel>Total Streams</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>
                  <CountUp to={totalWallets} initialValue={0} delayMs={140} />
                </StatNumber>
                <StatLabel>Wallets</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>
                  <CountUp to={totalArtists} initialValue={0} delayMs={230} />
                </StatNumber>
                <StatLabel>Artists</StatLabel>
              </StatCard>
            </StatsGrid>
          </Container>
        </StatsSection>
        <FeaturesSection>
          <Container>
            <FeaturesGrid>
              <FeatureCard
                onClick={() =>
                  window.open(
                    "https://docs.openaudio.org/concepts/wire-protocol",
                    "_blank",
                  )
                }
              >
                <FeatureImage>
                  <img src="/feature1.webp" alt="" />
                </FeatureImage>
                <FeatureBadge>Architecture</FeatureBadge>
                <FeatureTitle>
                  Decentralized Metadata + Media Pipeline
                </FeatureTitle>
                <FeatureDesc>
                  Native DDEX support used across the industry, partnering with
                  DistroKid, Warner, Kobalt and more. Harness the largest open
                  source catalog for music.
                </FeatureDesc>
              </FeatureCard>
              <FeatureCard
                onClick={() =>
                  window.open(
                    "https://docs.openaudio.org/concepts/artist-coins",
                    "_blank",
                  )
                }
              >
                <FeatureImage>
                  <img src="/feature2.webp" alt="" />
                </FeatureImage>
                <FeatureBadge>Economics</FeatureBadge>
                <FeatureTitle>Solana Powered Artist Coins</FeatureTitle>
                <FeatureDesc>
                  A standard for artist coins that trade against $AUDIO with
                  tooling for rewards, quests, bounties and airdrops. Create
                  novel fan club experiences.
                </FeatureDesc>
              </FeatureCard>
              <FeatureCard
                onClick={() =>
                  window.open(
                    "https://docs.openaudio.org/concepts/media-storage",
                    "_blank",
                  )
                }
              >
                <FeatureImage>
                  <img src="/feature3.webp" alt="" />
                </FeatureImage>
                <FeatureBadge>Scaling</FeatureBadge>
                <FeatureTitle>Unlimited Storage and Streaming</FeatureTitle>
                <FeatureDesc>
                  Media storage that elastically scales with incentivized,
                  staked $AUDIO validators. Distribute music everywhere with
                  provenance.
                </FeatureDesc>
              </FeatureCard>
              <FeatureCard
                onClick={() =>
                  window.open(
                    "https://docs.openaudio.org/tutorials/programmable-distribution",
                    "_blank",
                  )
                }
              >
                <FeatureImage>
                  <img src="/feature4.webp" alt="" />
                </FeatureImage>
                <FeatureBadge>Tooling</FeatureBadge>
                <FeatureTitle>Programmable Distribution Tools</FeatureTitle>
                <FeatureDesc>
                  Rails to build novel unlock experiences for music using
                  composable web3 primitives. Take releases beyond the current
                  streaming paradigm.
                </FeatureDesc>
              </FeatureCard>
            </FeaturesGrid>
          </Container>
        </FeaturesSection>
      </BelowFold>
      <HeroTicker>
        <FullWidthTerminal />
      </HeroTicker>
      <SiteFooter />
    </div>
  );
}

export default App;
