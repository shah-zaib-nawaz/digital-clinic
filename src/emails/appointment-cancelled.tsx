import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Preview,
  Heading,
} from '@react-email/components';

interface AppointmentCancelledEmailProps {
  patientName: string;
  doctorName: string;
  date: string;
  timeWindow: string;
  appointmentId: string;
  cancellationReason?: string;
  bookingUrl: string;
}

export function AppointmentCancelledEmail({
  patientName = 'Valued Patient',
  doctorName = 'Dr. Marcus Vance',
  date = 'Friday, November 13, 2026',
  timeWindow = '10:00 AM - 10:30 AM',
  appointmentId = 'APT-89214',
  cancellationReason = 'Patient requested cancellation',
  bookingUrl = 'http://localhost:3000/patient/book',
}: AppointmentCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment with {doctorName} on {date} has been cancelled</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headerLogoStyle}>Digital Clinic</Heading>
            <Text style={headerSubStyle}>Appointment Cancellation Notice</Text>
          </Section>

          {/* Hero */}
          <Section style={heroStyle}>
            <div style={badgeStyle}>CANCELLED</div>
            <Heading style={titleStyle}>Appointment Cancelled</Heading>
            <Text style={subtitleStyle}>
              Hello {patientName}, your scheduled consultation has been officially cancelled.
            </Text>
          </Section>

          {/* Details Card */}
          <Section style={cardStyle}>
            <table style={{ width: '100%' }} cellPadding={4} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={labelStyle}>Physician:</td>
                  <td style={valueBoldStyle}>{doctorName}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Cancelled Date:</td>
                  <td style={valueStyle}>{date} ({timeWindow})</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Reference:</td>
                  <td style={codeStyle}>{appointmentId}</td>
                </tr>
                {cancellationReason && (
                  <tr>
                    <td style={labelStyle}>Reason:</td>
                    <td style={valueStyle}>{cancellationReason}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <Section style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button style={buttonStyle} href={bookingUrl}>
                Book a New Consultation
              </Button>
            </Section>
          </Section>

          <Section style={noticeStyle}>
            <Text style={noticeTextStyle}>
              If this cancellation was in error or you need urgent medical assistance, please contact our front desk immediately.
            </Text>
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

export default AppointmentCancelledEmail;

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
  backgroundColor: '#334155',
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
  color: '#cbd5e1',
  fontSize: '11px',
  margin: '4px 0 0 0',
};

const heroStyle: React.CSSProperties = {
  padding: '24px 24px 8px 24px',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
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

const noticeStyle: React.CSSProperties = {
  margin: '0 24px 16px 24px',
  padding: '12px',
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  border: '1px solid #fef3c7',
};

const noticeTextStyle: React.CSSProperties = {
  color: '#92400e',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
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
