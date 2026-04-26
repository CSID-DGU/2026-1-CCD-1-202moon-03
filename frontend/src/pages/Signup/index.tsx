import SignupForm from '../../features/auth/signup/SignupForm';

function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f7fbff_56%,_#edf6ff_100%)] px-6 py-12">
      <SignupForm />
    </main>
  );
}

export default SignupPage;
