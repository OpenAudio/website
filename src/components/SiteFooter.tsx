import styled from '@emotion/styled'
import Logo from '../assets/logo.svg?react'

const Footer = styled.footer`
  background: #000000;
  color: #ffffff;
  padding: 96px 0;
  margin-top: 64px;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 28px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`

const FooterCol = styled.div``

const FooterBrandGrid = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  svg { height: 28px; width: auto; display: block; }
`

const FooterTitle = styled.h4`
  margin: 0 0 8px 0;
  font-family: "new-science", sans-serif;
  font-weight: 800;
  font-size: 22px;
`

const FooterText = styled.p`
  margin: 0;
  font-family: "new-science", sans-serif;
  font-size: 14px;
  opacity: 0.85;
`

const FooterHeading = styled.div`
  font-family: "new-science", sans-serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 10px;
`

const FooterLinks = styled.div`
  display: grid;
  gap: 8px;
  a {
    color: #ffffff;
    text-decoration: none;
    opacity: 0.9;
    transition: opacity 200ms ease;
  }
  a:hover { opacity: 0.7; }
`

export default function SiteFooter() {
  return (
    <Footer>
      <Container>
        <FooterGrid>
          <FooterBrandGrid>
            <Logo />
            <FooterCol>
              <FooterTitle>Open Audio Protocol</FooterTitle>
              <FooterText>© Open Audio Protocol. Powered by $AUDIO.</FooterText>
            </FooterCol>
          </FooterBrandGrid>
          <FooterCol>
            <FooterHeading>Resources</FooterHeading>
            <FooterLinks>
              <a href="https://docs.openaudio.org">Docs</a>
              <a href="/security">Security</a>
            </FooterLinks>
          </FooterCol>
          <FooterCol>
            <FooterHeading>Community</FooterHeading>
            <FooterLinks>
              <a href="https://docs.openaudio.org/blog">Blog</a>
              <a href="https://github.com/OpenAudio" target="_blank" rel="noreferrer">Github</a>
              <a href="https://explorer.openaudio.org">Explorer</a>
            </FooterLinks>
          </FooterCol>
        </FooterGrid>
      </Container>
    </Footer>
  )
}


