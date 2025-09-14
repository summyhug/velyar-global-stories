import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-velyar-earth/10 to-velyar-warm/10 p-4 content-safe-bottom">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="bg-background/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-nunito text-velyar-earth">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Account information (name, email, username)</li>
                <li>Profile information (city, country, date of birth)</li>
                <li>Content you upload (videos, comments)</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">2. How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide and improve our services</li>
                <li>Personalize your experience</li>
                <li>Communicate with you</li>
                <li>Ensure platform safety and security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">3. Your Rights Under GDPR</h3>
              <p>As an EU resident, you have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Erase your data ("right to be forgotten")</li>
                <li>Restrict processing of your data</li>
                <li>Data portability</li>
                <li>Object to processing</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">4. Data Sharing and Transfers</h3>
              <p>We do not sell your personal data. We may share data with service providers, for legal compliance, or with your consent. International transfers are protected by appropriate safeguards.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">5. Data Retention</h3>
              <p>We retain your data only as long as necessary for the purposes outlined in this policy or as required by law.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">6. Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">7. Cookies and Tracking</h3>
              <p>We use essential cookies for functionality and analytics cookies to improve our service. You can manage cookie preferences in your browser settings.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">8. Contact Us</h3>
              <p>For privacy-related questions or to exercise your rights, please contact our Data Protection Officer through our support channels.</p>
            </section>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;