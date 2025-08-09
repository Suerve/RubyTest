
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { Header } from '@/components/layout/header';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Calculator, FileText, Keyboard, CheckCircle, Users, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Logo type="tagline" size="xl" className="mx-auto" />
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-[#004875] to-[#f8951d] bg-clip-text text-transparent">
                Professional Skills Testing Platform
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Assess your proficiency in typing, digital literacy, mathematics, and English comprehension 
                with our comprehensive testing suite.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Four Essential Skill Areas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive assessments designed to measure your professional readiness
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[#004875] text-white flex items-center justify-center mb-4">
                  <Keyboard className="h-6 w-6" />
                </div>
                <CardTitle>Typing Tests</CardTitle>
                <CardDescription>10-key and keyboard typing speed and accuracy assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Timed typing challenges</li>
                  <li>• Speed & accuracy metrics</li>
                  <li>• 10-key numeric testing</li>
                  <li>• Professional benchmarks</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[#f8951d] text-white flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6" />
                </div>
                <CardTitle>Digital Literacy</CardTitle>
                <CardDescription>Computer and technology proficiency evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Hardware knowledge</li>
                  <li>• Software operation</li>
                  <li>• Internet navigation</li>
                  <li>• Email management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[#f8951d] text-white flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6" />
                </div>
                <CardTitle>Basic Math</CardTitle>
                <CardDescription>Mathematical skills from 5th to 12th grade level</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Adaptive difficulty</li>
                  <li>• Grade-level scoring</li>
                  <li>• Core math concepts</li>
                  <li>• Progress tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[#8a8a8d] text-white flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Basic English</CardTitle>
                <CardDescription>Language mastery and reading comprehension</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Grammar & vocabulary</li>
                  <li>• Reading comprehension</li>
                  <li>• Writing proficiency</li>
                  <li>• Grade-level assessment</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Rubicon Programs?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade assessments with comprehensive reporting
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-[#004875] text-white flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Adaptive Testing</h3>
              <p className="text-muted-foreground">
                Tests adapt to your skill level for accurate assessment and efficient evaluation.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-[#f8951d] text-white flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Industry-standard security with reliable results you can trust for professional use.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-[#f8951d] text-white flex items-center justify-center mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Professional Reporting</h3>
              <p className="text-muted-foreground">
                Detailed reports with multiple formats including certificates and official letterhead.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Create your account today and begin assessing your professional skills.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Create Account
                <CheckCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/10">
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo type="horizontal" size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2025 Rubicon Programs. Professional skills testing platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
