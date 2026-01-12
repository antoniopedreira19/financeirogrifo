const handleAprovar = async () => {
    if (!user?.id) return;

    setIsApprovingToSienge(true);
    try {
      // Call webhook to send titulo to Sienge and get id_sienge
      
      // --- ALTERAÇÃO AQUI: Envolver tudo em 'record' ---
      const webhookPayload = {
        record: {
          id: titulo.id,
          empresa: titulo.empresa,
          credor: titulo.credor,
          documento_tipo: titulo.tipoDocumento,
          documento_numero: titulo.documento,
          obra_codigo: titulo.obraCodigo,
          centro_custo: titulo.centroCusto,
          etapa: titulo.etapaApropriada,
          codigo_etapa: titulo.codigoEtapa,
          valor_total: titulo.valorTotal,
          descontos: titulo.descontos,
          parcelas: titulo.parcelas,
          tipo_documento: titulo.tipoDocumentoFiscal,
          numero_documento: titulo.numeroDocumento,
          data_emissao: titulo.dataEmissao,
          data_vencimento: titulo.dataVencimento,
          plano_financeiro: titulo.planoFinanceiro,
          dados_bancarios: titulo.dadosBancarios,
          documento_url: titulo.documentoUrl,
          descricao: titulo.descricao,
        }
      };
      // ------------------------------------------------

      const webhookResponse = await fetch("https://grifoworkspace.app.n8n.cloud/webhook/titulos-sienge-pendentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      // ... resto do código continua igual ...