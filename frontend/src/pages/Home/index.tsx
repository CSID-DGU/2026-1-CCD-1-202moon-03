function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <section className="flex w-full max-w-[500px] flex-col items-center">
        <div className="flex h-[100px] w-[240px] items-center justify-center bg-[#9b9b9b] text-[22px] font-medium text-white">
          캐릭터 or logo
        </div>

        <button
          className="mt-7 inline-flex h-[100px] w-full max-w-[500px] items-center justify-center bg-[#9b9b9b] text-[60px] font-normal tracking-tight text-white transition-colors hover:bg-[#8f8f8f]"
          type="button"
        >
          TADAC START
        </button>
      </section>
    </main>
  );
}

export default HomePage;
