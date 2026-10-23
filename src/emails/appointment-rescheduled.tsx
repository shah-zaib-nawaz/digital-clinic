import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
  Heading,
} from '@react-email/components';

interface AppointmentRescheduledEmailProps {
  patientName: string;
  doctorName: string;
  previousDate: string;
  newDate: string;
  newTimeWindow: string;
  appointmentId: string;
  portalUrl: string;
  reason?: string;
}

export function AppointmentRescheduledEmail({
  patientName = 'Valued Patient',
  doctorName = 'Dr. Marcus Vance',
  previousDate = 'Friday, November 13, 2026',
  newDate = 'Wednesday, November 18, 2026',
  newTimeWindow = '11:00 AM - 11:30 AM',
  appointmentId = 'APT-89214',
  portalUrl = 'http://localhost:3000/patient/appointments',
  reason,
}: AppointmentRescheduledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment with {doctorName} has been rescheduled to {newDate}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headerLogoStyle}>Digital Clinic</Heading>
            <Text style={headerSubStyle}>Schedule Update Notification</Text>
          </Section>

          {/* Hero */}
          <Section style={heroStyle}>
            <div style={badgeStyle}>SCHEDULE ADJUSTED</div>
            <Heading style={titleStyle}>Appointment Rescheduled</Heading>
            <Text style={subtitleStyle}>
              Hello {patientName}, your consultation with {doctorName} has been rescheduled to the updated date and time below.
            </Text>
          </Section>

          {/* Details Card */}
          <Section style={cardStyle}>
            <Text style={cardHeaderStyle}>Updated Schedule Details</Text>
            <Hr style={hrStyle} />

            <table style={{ width: '100%' }} cellPadding={4} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={labelStyle}>Physician:</td>
                  <td style={valueBoldStyle}>{doctorName}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Previous Date:</td>
                  <td style={strikethroughStyle}>{previousDate}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>New Date:</td>
                  <td style={newHighlightStyle}>{newDate}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>New Time:</td>
                  <td style={newHighlightStyle}>{newTimeWindow}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Reference:</td>
                  <td style={codeStyle}>{appointmentId}</td>
                </tr>
                {reason && (
                  <tr>
                    <td style={labelStyle}>Reason:</td>
                    <td style={valueStyle}>{reason}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <Section style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button style={buttonStyle} href={portalUrl}>
                Confirm or Manage in Portal
              </Button>
            </Section>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Digital Clinic Healthcare Network • Questions? Contact support@digitalclinic.test
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentRescheduledEmail;

const mainStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0',
  padding: '24px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  maxWidth: '560px',
  margin: '0 auto',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#0f766e',
  padding: '24px',
  textAlign: 'center',
};

const headerLogoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '800',
  margin: '0',
};

const headerSubStyle: React.CSSProperties = {
  color: '#ccfbf1',
  fontSize: '11px',
  margin: '4px 0 0 0',
};

const heroStyle: React.CSSProperties = {
  padding: '24px 24px 8px 24px',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  fontSize: '11px',
  fontWeight: '700',
  padding: '3px 8px',
  borderRadius: '9999px',
  display: 'inline-block',
  marginBottom: '10px',
};

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  margin: '16px 24px',
  padding: '20px',
};

const cardHeaderStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '13px',
  fontWeight: '700',
  textTransform: 'uppercase',
  margin: '0 0 6px 0',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '12px 0 16px 0',
};

const labelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  width: '120px',
};

const valueStyle: React.CSSProperties = {
  color: '#334155',
  fontSize: '13px',
};

const valueBoldStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '13px',
  fontWeight: '600',
};

const strikethroughStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '13px',
  textDecoration: 'line-through',
};

const newHighlightStyle: React.CSSProperties = {
  color: '#0f766e',
  fontSize: '13px',
  fontWeight: '700',
};

const codeStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '12px',
  fontFamily: 'monospace',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#0f766e',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '10px 24px',
  display: 'inline-block',
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  padding: '16px 24px',
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  margin: '0',
};
