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

interface BookingConfirmationEmailProps {
  patientName: string;
  doctorName: string;
  specialization: string;
  departmentName: string;
  date: string;
  timeWindow: string;
  appointmentId: string;
  portalUrl: string;
  chiefComplaint?: string;
}

export function BookingConfirmationEmail({
  patientName = 'Valued Patient',
  doctorName = 'Dr. Marcus Vance',
  specialization = 'Interventional Cardiology',
  departmentName = 'Cardiology',
  date = 'Monday, November 16, 2026',
  timeWindow = '10:00 AM - 10:30 AM',
  appointmentId = 'APT-89214',
  portalUrl = 'http://localhost:3000/patient/appointments',
  chiefComplaint,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your consultation with {doctorName} is confirmed for {date}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headerLogoStyle}>Digital Clinic</Heading>
            <Text style={headerSubStyle}>Clinical Excellence & Patient Care</Text>
          </Section>

          {/* Hero Banner */}
          <Section style={heroStyle}>
            <Heading style={titleStyle}>Appointment Confirmed</Heading>
            <Text style={subtitleStyle}>
              Hello {patientName}, your upcoming medical consultation has been successfully booked and added to the physician's schedule.
            </Text>
          </Section>

          {/* Details Card */}
          <Section style={cardStyle}>
            <Text style={cardHeaderStyle}>Consultation Overview</Text>
            <Hr style={hrStyle} />

            <table style={tableStyle} cellPadding={4} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={labelStyle}>Physician:</td>
                  <td style={valueBoldStyle}>{doctorName}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Specialty:</td>
                  <td style={valueStyle}>{specialization} ({departmentName})</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Date:</td>
                  <td style={valueBoldStyle}>{date}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Time:</td>
                  <td style={valueBoldStyle}>{timeWindow}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Booking Ref:</td>
                  <td style={codeStyle}>{appointmentId}</td>
                </tr>
                {chiefComplaint && (
                  <tr>
                    <td style={labelStyle}>Reason:</td>
                    <td style={valueStyle}>{chiefComplaint}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button style={buttonStyle} href={portalUrl}>
                View Consultation Details
              </Button>
            </Section>
          </Section>

          {/* Instructions Box */}
          <Section style={noteBoxStyle}>
            <Text style={noteTitleStyle}>Patient Preparation Guidelines:</Text>
            <Text style={noteTextStyle}>
              • Please arrive or sign in to your telemedicine room 10 minutes prior to your scheduled time.<br />
              • Bring a government-issued photo ID and insurance documentation.<br />
              • Cancellations or reschedules must be completed at least 4 hours in advance via the patient portal.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Digital Clinic Healthcare Network • 100 Medical Center Way, Suite 400<br />
              Questions? Contact patient-support@digitalclinic.test
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default BookingConfirmationEmail;

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
  padding: '28px 24px',
  textAlign: 'center',
};

const headerLogoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
};

const headerSubStyle: React.CSSProperties = {
  color: '#ccfbf1',
  fontSize: '12px',
  margin: '4px 0 0 0',
};

const heroStyle: React.CSSProperties = {
  padding: '28px 24px 12px 24px',
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
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '12px 0 16px 0',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  width: '110px',
  verticalAlign: 'top',
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
  color: '#0f766e',
  fontSize: '13px',
  fontWeight: '700',
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

const noteBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
  margin: '16px 24px',
  padding: '16px',
};

const noteTitleStyle: React.CSSProperties = {
  color: '#166534',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 6px 0',
};

const noteTextStyle: React.CSSProperties = {
  color: '#15803d',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0',
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  padding: '20px 24px',
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  lineHeight: '1.5',
  margin: '0',
};
