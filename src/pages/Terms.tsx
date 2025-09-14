import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
            <CardTitle className="text-2xl font-nunito text-velyar-earth">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">1. Acceptance of Terms</h3>
              <p>By accessing and using Velyar, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">2. Content Guidelines</h3>
              <p>Users are responsible for the content they upload. Prohibited content includes but is not limited to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Illegal, harmful, or offensive material</li>
                <li>Content violating intellectual property rights</li>
                <li>Spam, misleading, or deceptive content</li>
                <li>Personal information of others without consent</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">3. Age Requirements and Restrictions</h3>
              <p>You must be at least 13 years old to use this service. Users under 16 may have restricted access to certain features to comply with data protection laws.</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Users must provide accurate date of birth information</li>
                <li>Age verification is required for account creation</li>
                <li>Restricted accounts have limited feature access for safety</li>
                <li>False age information may result in account suspension</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">4. User Conduct</h3>
              <p>Users must not engage in activities that could harm the platform or other users, including but not limited to hacking, harassment, or misuse of the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">5. Content Reporting and Community Moderation</h3>
              <p>We employ a community-based moderation system where users can report content that violates our guidelines. Content may be automatically hidden after multiple reports.</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Users can report inappropriate, harmful, or illegal content</li>
                <li>Reports are reviewed within 24 hours by our moderation team</li>
                <li>Multiple reports may result in automatic content hiding</li>
                <li>False or malicious reports may result in account restrictions</li>
                <li>Anonymous reporting system protects user privacy</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">6. Appeal Process</h3>
              <p>Content creators have the right to appeal moderation decisions within 30 days of action being taken.</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Appeals are reviewed by human moderators within 48 hours</li>
                <li>Only one appeal per piece of content is allowed</li>
                <li>Detailed explanations must be provided for appeal consideration</li>
                <li>Successful appeals result in immediate content restoration</li>
                <li>Appeal decisions are final and binding</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">7. Privacy and Data Protection</h3>
              <p>We are committed to protecting your privacy in accordance with GDPR and other applicable data protection laws. Please refer to our Privacy Policy for detailed information.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">8. Automated Content Moderation</h3>
              <p>We employ automated systems to detect and prevent the upload of prohibited content before it appears on our platform.</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Automated filtering for text and visual content</li>
                <li>Real-time content analysis during upload</li>
                <li>Machine learning systems continuously improve detection</li>
                <li>Automated actions are logged for transparency</li>
                <li>Users can appeal automated decisions</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">9. Transparency and Compliance</h3>
              <p>We maintain transparency in our moderation practices and publish regular transparency reports.</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Quarterly transparency reports on moderation actions</li>
                <li>Clear documentation of community guidelines</li>
                <li>Regular updates to moderation policies</li>
                <li>Compliance with Digital Services Act (DSA) requirements</li>
                <li>User access to their moderation history</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">10. Limitation of Liability</h3>
              <p>Velyar is provided "as is" without warranties. We shall not be liable for any damages arising from the use of our platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">11. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">12. Contact Information</h3>
              <p>For questions about these terms, please contact us through our support channels.</p>
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

export default Terms;