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

interface AppointmentReminderEmailProps {
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeWindow: string;
  portalUrl: string;
}

export function AppointmentReminderEmail({
  patientName = 'Valued Patient',
  doctorName = 'Dr. Marcus Vance',
  specialization = 'Interventional Cardiology',
  date = 'Tomorrow at 10:00 AM',
  timeWindow = '10:00 AM - 10:30 AM',
  portalUrl = 'http://localhost:3000/patient/appointments',
}: AppointmentReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your medical consultation is scheduled for {date}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={headerLogoStyle}>Digital Clinic</Heading>
            <Text style={headerSubStyle}>Automated Care Reminders</Text>
          </Section>

          {/* Hero */}
          <Section style={heroStyle}>
            <div style={badgeStyle}>24-HOUR REMINDER</div>
            <Heading style={titleStyle}>Upcoming Consultation Tomorrow</Heading>
            <Text style={subtitleStyle}>
              Hello {patientName}, this is a reminder for your upcoming medical visit with {doctorName}.
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
                  <td style={labelStyle}>Specialty:</td>
                  <td style={valueStyle}>{specialization}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Scheduled Time:</td>
                  <td style={valueBoldStyle}>{date} ({timeWindow})</td>
                </tr>
              </tbody>
            </table>

            <Section style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button style={buttonStyle} href={portalUrl}>
                Open Patient Portal
              </Button>
            </Section>
          </Section>

          {/* Preparation Checklist */}
          <Section style={checklistStyle}>
            <Text style={checkTitleStyle}>Quick Checklist for Tomorrow:</Text>
            <Text style={checkTextStyle}>
              ✓ Review any recent symptoms or medication changes to discuss.<br />
              ✓ Test your camera and microphone if attending via telemedicine.<br />
              ✓ If you must reschedule, please notify us as soon as possible.
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

export default AppointmentReminderEmail;

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
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '11px',
  fontWeight: '700',
  padding: '3px 8px',
  borderRadius: '9999px',
  display: 'inline-block',
  marginBottom: '10px',
  letterSpacing: '0.5px',
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

const checklistStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
  margin: '16px 24px',
  padding: '16px',
};

const checkTitleStyle: React.CSSProperties = {
  color: '#1e40af',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 6px 0',
};

const checkTextStyle: React.CSSProperties = {
  color: '#1e3a8a',
  fontSize: '12px',
  lineHeight: '1.6',
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
