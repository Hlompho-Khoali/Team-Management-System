"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1ea",
        color: "#222222",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5dfd6",
          padding: "20px 50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "30px",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#222222",
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-1px",
          }}
        >
          Work-Integrated Learning
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <a
            href="#about"
            style={{
              color: "#4f4a44",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            About
          </a>

          <a
            href="#features"
            style={{
              color: "#4f4a44",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Features
          </a>

          <Link
            href="/login"
            style={{
              color: "#222222",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            style={{
              padding: "11px 18px",
              borderRadius: "9px",
              background: "#222222",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Create Account
          </Link>
        </nav>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "90px 40px 80px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "70px",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 16px",
              color: "#8a8175",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            A steAm workspace
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: "700px",
              fontSize: "64px",
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            Where learning,
            <br />
            teamwork and ideas
            <br />
            come together.
          </h1>

          <p
            style={{
              maxWidth: "600px",
              marginTop: "28px",
              color: "#625d56",
              fontSize: "18px",
              lineHeight: 1.8,
            }}
          >
            Work-Integrated Learning brings people, projects and ideas into one shared company
            workspace — making it easier to learn, collaborate and keep track of
            the work that matters.
          </p>

          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "34px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              style={{
                padding: "14px 22px",
                borderRadius: "10px",
                background: "#222222",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              Get Started
            </Link>

            <Link
              href="/login"
              style={{
                padding: "14px 22px",
                borderRadius: "10px",
                border: "1px solid #d4ccc0",
                background: "#ffffff",
                color: "#222222",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        <div
          style={{
            minHeight: "390px",
            borderRadius: "24px",
            background: "#222222",
            padding: "34px",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#aaa39a",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              For external companies
            </p>

            <h2
              style={{
                fontSize: "42px",
                lineHeight: 1.15,
                fontWeight: 800,
                margin: "18px 0 0",
              }}
            >
              Hire A
              <br />
              Student.
            </h2>
          </div>

          <p
            style={{
              margin: 0,
              color: "#d2ccc4",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            Discover skilled and employable students.
            <br />
            Partner with us for direct access to a pipeline of job-ready,
            vetted young professionals to reduce youth unemployment and build
            South Africa&apos;s digital future.
            <br />
            1000+ students hired since inception.
            <br />
            <Link href="/contact" style={contactLinkStyle}>
              Contact Us
            </Link>
          </p>
        </div>
      </section>

      <section
        id="about"
        style={{
          background: "#ffffff",
          borderTop: "1px solid #e5dfd6",
          borderBottom: "1px solid #e5dfd6",
          padding: "80px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <p style={eyebrowStyle}>About steAm</p>

          <h2
            style={{
              margin: "10px 0 20px",
              fontSize: "40px",
              letterSpacing: "-1px",
            }}
          >
            Learning through curiosity and creativity.
          </h2>

          <p style={paragraphStyle}>
            steAm brings Science, Technology, Engineering, Art and Mathematics
            together in a way that encourages people to explore, create,
            experiment and learn without making the process feel boring.
          </p>
        </div>
      </section>

      <section
        id="features"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 40px",
        }}
      >
        <p style={eyebrowStyle}>The Workspace</p>

        <h2
          style={{
            margin: "10px 0 35px",
            fontSize: "40px",
            letterSpacing: "-1px",
          }}
        >
          Everything in one place.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px",
          }}
        >
          <FeatureCard
            title="Teams"
            text="Find teams, request to join and stay connected with the people you work with."
          />

          <FeatureCard
            title="Projects"
            text="Keep track of assigned projects, deadlines, links and progress."
          />

          <FeatureCard
            title="Communication"
            text="Stay connected through team conversations and direct communication."
          />

          <FeatureCard
            title="Company Updates"
            text="Keep up with announcements, events and notifications from the workspace."
          />
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          borderTop: "1px solid #e5dfd6",
          borderBottom: "1px solid #e5dfd6",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        <p style={eyebrowStyle}>Our Partner</p>
        <img
          src="/tut-logo.png"
          alt="Tshwane University of Technology"
          style={{
            display: "block",
            width: "180px",
            height: "180px",
            objectFit: "contain",
            margin: "18px auto 0",
          }}
        />
      </section>

      <footer
        style={{
          background: "#222222",
          color: "#ffffff",
          padding: "32px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <strong style={{ fontSize: "20px" }}>Work-Integrated Learning</strong>

          <span
            style={{
              color: "#aaa39a",
              fontSize: "13px",
            }}
          >
            A steAm workspace
          </span>
        </div>
      </footer>
    </main>
  );
}

const contactLinkStyle = {
  display: "inline-block",
  marginTop: "12px",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: "4px",
};

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e5dfd6",
        borderRadius: "14px",
        padding: "24px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "20px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "12px 0 0",
          color: "#716b63",
          lineHeight: 1.7,
          fontSize: "14px",
        }}
      >
        {text}
      </p>
    </article>
  );
}

const eyebrowStyle = {
  margin: 0,
  color: "#8a8175",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
};

const paragraphStyle = {
  maxWidth: "850px",
  color: "#625d56",
  fontSize: "16px",
  lineHeight: 1.8,
  margin: "0 0 18px",
};
