import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-velyar-earth/10 to-velyar-warm/10 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
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
              <h3 className="font-semibold text-velyar-earth mb-2">3. User Conduct</h3>
              <p>Users must not engage in activities that could harm the platform or other users, including but not limited to hacking, harassment, or misuse of the platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">4. Privacy and Data Protection</h3>
              <p>We are committed to protecting your privacy in accordance with GDPR and other applicable data protection laws. Please refer to our Privacy Policy for detailed information.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">5. Content Moderation</h3>
              <p>We reserve the right to review, moderate, and remove content that violates these terms or applicable laws. Automated and human moderation systems may be employed.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">6. Limitation of Liability</h3>
              <p>Velyar is provided "as is" without warranties. We shall not be liable for any damages arising from the use of our platform.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">7. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes.</p>
            </section>

            <section>
              <h3 className="font-semibold text-velyar-earth mb-2">8. Contact Information</h3>
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